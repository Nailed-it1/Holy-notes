const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

const fileTree = document.getElementById('fileTree');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentTextarea = document.getElementById('noteContent');

let activeFile = null;

// Event listener for file tree clicks
fileTree.addEventListener('click', (event) => {
  const target = event.target;

  if (target.classList.contains('file')) {
    const filePath = target.dataset.path;
    openNoteFile(filePath);
  } else if (target.classList.contains('folder')) {
    target.classList.toggle('active');
  }
});

// Event listener for note title input
noteTitleInput.addEventListener('input', (event) => {
  const newTitle = event.target.value;
  updateNoteTitle(newTitle);
});

// Event listener for note content textarea
noteContentTextarea.addEventListener('input', (event) => {
  const newContent = event.target.value;
  updateNoteContent(newContent);
});

// Open a note file
function openNoteFile(filePath) {
  fileTree.querySelectorAll('.file').forEach((file) => {
    file.classList.remove('active');
  });

  fs.readFile(filePath, 'utf-8', (err, fileContent) => {
    if (err) {
      console.error(err);
      return;
    }

    activeFile = filePath;
    noteTitleInput.value = path.basename(filePath, '.md');
    noteContentTextarea.value = fileContent;
    fileTree.querySelector(`[data-path="${filePath}"]`).classList.add('active');
  });
}

// Save the current note file
function saveNote() {
  if (activeFile) {
    const newContent = noteContentTextarea.value;
    fs.writeFile(activeFile, newContent, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      alert('File saved successfully!');
    });
  }
}

// Delete the current note file
function deleteNote() {
  if (activeFile) {
    const confirmation = confirm('Are you sure you want to delete this file?');

    if (confirmation) {
      fs.unlink(activeFile, (err) => {
        if (err) {
          console.error(err);
          return;
        }

        activeFile = null;
        noteTitleInput.value = '';
        noteContentTextarea.value = '';
        fileTree.querySelector(`[data-path="${activeFile}"]`).remove();
        alert('File deleted successfully!');
      });
    }
  }
}

// Create a new note
function createNewNote() {
  const newNoteName = prompt('Enter the name of the new note:');
  if (!newNoteName) return;

  const folderPath = document.querySelector('.folder.active')?.dataset.path;
  if (!folderPath) {
    alert('Please select a folder to create the note.');
    return;
  }

  const newNoteFileName = `${newNoteName}.md`;
  const newNoteFilePath = path.join(folderPath, newNoteFileName);

  fs.writeFile(newNoteFilePath, '', (err) => {
    if (err) {
      console.error(err);
      return;
    }

    const noteElement = document.createElement('div');
    noteElement.classList.add('file');
    noteElement.textContent = newNoteName;
    noteElement.dataset.path = newNoteFilePath;
    fileTree.appendChild(noteElement);
    openNoteFile(newNoteFilePath); // Open the newly created note
  });
}

// Create a new folder
function createNewFolder() {
  const newFolderName = document.getElementById('newFolderName').value;
  const folderPath = path.join(__dirname, newFolderName);

  fs.mkdir(folderPath, (err) => {
    if (err) {
      console.error(err);
      return;
    }

    const folderElement = document.createElement('div');
    folderElement.classList.add('folder');
    folderElement.textContent = newFolderName;
    fileTree.appendChild(folderElement);
    document.getElementById('newFolderName').value = '';
  });
}

// Create the file tree
function createFileTree() {
  fileTree.innerHTML = ''; // Clear existing content

  const rootPath = __dirname; // Update this with your desired root folder path
  const rootFolder = document.createElement('div');
  rootFolder.classList.add('folder');
  rootFolder.textContent = path.basename(rootPath);
  rootFolder.dataset.path = rootPath;
  fileTree.appendChild(rootFolder);

  createFolderStructure(rootPath, rootFolder);
}

// Recursively create the folder structure
function createFolderStructure(folderPath, parentElement) {
  fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file.name);
      const element = document.createElement('div');

      if (file.isDirectory()) {
        element.classList.add('folder');
        element.textContent = file.name;
        element.dataset.path = filePath;
        parentElement.appendChild(element);
        createFolderStructure(filePath, element); // Recursively create folder structure
      } else {
        if (path.extname(file.name) === '.md') {
          element.classList.add('file');
          element.textContent = path.basename(file.name, '.md');
          element.dataset.path = filePath;
          parentElement.appendChild(element);
        }
      }
    });
  });
}

// Update the note title
function updateNoteTitle(newTitle) {
  if (activeFile) {
    const newFileName = `${newTitle}.md`;
    const newFilePath = path.join(path.dirname(activeFile), newFileName);

    fs.rename(activeFile, newFilePath, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      activeFile = newFilePath;
      fileTree.querySelector(`[data-path="${activeFile}"]`).textContent = newTitle;
      alert('File renamed successfully!');
    });
  }
}

// Update the note content
function updateNoteContent(newContent) {
  if (activeFile) {
    fs.writeFile(activeFile, newContent, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      alert('File saved successfully!');
    });
  }
}

// Initialize the app
function initApp() {
  createFileTree();
}

// Call the initApp function when the DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
