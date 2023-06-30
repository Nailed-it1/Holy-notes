const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('open-dialog', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Markdown Files',
        extensions: ['md'],
      },
    ],
  });

  if (!result.canceled) {
    const filePath = result.filePaths[0];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    event.reply('file-opened', filePath, fileContent);
  }
});

ipcMain.on('save-dialog', async (event, filePath, content) => {
  if (filePath) {
    fs.writeFileSync(filePath, content);
    event.reply('file-saved', filePath);
  } else {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        {
          name: 'Markdown Files',
          extensions: ['md'],
        },
      ],
    });

    if (!result.canceled) {
      const savePath = result.filePath;
      fs.writeFileSync(savePath, content);
      event.reply('file-saved', savePath);
    }
  }
});

ipcMain.on('delete-file', async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    event.reply('file-deleted', filePath);
  } catch (error) {
    event.reply('file-delete-error', error.message);
  }
});

ipcMain.on('rename-file', async (event, filePath, newFileName) => {
  try {
    const directory = path.dirname(filePath);
    const newFilePath = path.join(directory, newFileName);
    fs.renameSync(filePath, newFilePath);
    event.reply('file-renamed', newFilePath);
  } catch (error) {
    event.reply('file-rename-error', error.message);
  }
});

ipcMain.on('create-folder', async (event, folderPath, folderName) => {
  try {
    const newFolderPath = path.join(folderPath, folderName);
    fs.mkdirSync(newFolderPath);
    event.reply('folder-created', newFolderPath);
  } catch (error) {
    event.reply('folder-create-error', error.message);
  }
});

ipcMain.on('delete-folder', async (event, folderPath) => {
  try {
    fs.rmdirSync(folderPath, { recursive: true });
    event.reply('folder-deleted', folderPath);
  } catch (error) {
    event.reply('folder-delete-error', error.message);
  }
});

ipcMain.on('search-files', async (event, searchQuery, rootPath) => {
  try {
    const searchResults = searchFiles(searchQuery, rootPath);
    event.reply('file-searched', searchResults);
  } catch (error) {
    event.reply('file-search-error', error.message);
  }
});

function searchFiles(searchQuery, rootPath) {
  const results = [];
  const files = fs.readdirSync(rootPath);

  for (const file of files) {
    const filePath = path.join(rootPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const nestedResults = searchFiles(searchQuery, filePath);
      results.push(...nestedResults);
    } else if (file.toLowerCase().includes(searchQuery.toLowerCase())) {
      results.push(filePath);
    }
  }

  return results;
}
