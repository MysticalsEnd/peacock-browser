const { ipcMain, app, session, screen, BrowserWindow, nativeTheme, Menu } = require('electron');

const menuTemplate = [
		{
			label: 'Window',
			submenu: [
				{
					label: 'Open Settings',
					accelerator: 'CmdOrCtrl+Shift+S',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'settings');
					}
				},
				{
					label: 'Open DevTools',
					accelerator: 'CmdOrCtrl+Shift+I',
					click: async () => {
						if(mainWindow.isDevToolsOpened()){
							mainWindow.closeDevTools();
						} else {
							mainWindow.openDevTools();
						}
					}
				},
				{
					label: 'Restart Peacock',
					accelerator: 'CmdOrCtrl+Alt+R',
					click: async () => {
						// mainWindow.webContents.send('keyboardShortcut', 'restart');
						app.relaunch();
						app.exit(0);
					}
				},
				{
					label: 'Open History',
					accelerator: 'CmdOrCtrl+H',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'history');
					}
				},
				{
					label: 'Clear History',
					accelerator: 'CmdOrCtrl+Shift+H',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'clearHistory');
					}
				},
				{
					label: 'Start VPN',
					accelerator: 'CmdOrCtrl+Shift+V',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'startVPN');
					}
				},
				{
					label: 'Stop VPN',
					accelerator: 'CmdOrCtrl+Alt+V',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'stopVPN');
					}
				},
				{
					label: 'Focus Searchbar',
					accelerator: 'CmdOrCtrl+E',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'focusSearchbar');
					}
				},
				{
					label: 'Get Metrics',
					accelerator: 'CmdOrCtrl+G',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'getMetrics');
					}
				},
				{
					label: 'Toggle Customization Mode',
					accelerator: 'CmdOrCtrl+Alt+C',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'toggleCustomization');
					}
				}
			]
		},
		{
			label: 'Website',
			submenu: [
				{
					label: 'Open DevTools',
					accelerator: 'CmdOrCtrl+Alt+I',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'devTools');
					}
				},
				{
					label: 'Zoom In',
					accelerator: 'CmdOrCtrl+=',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'zoomIn');
					}
				},
				{
					label: 'Zoom Out',
					accelerator: 'CmdOrCtrl+-',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'zoomOut');
					}
				},
				{
					label: 'Reset Zoom',
					accelerator: 'CmdOrCtrl+Shift+-',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'resetZoom');
					}
				},
				{
					label: 'Refresh Page',
					accelerator: 'CmdOrCtrl+R',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'refreshPage');
					}
				},
				{
					label: 'Reload Page',
					accelerator: 'F5',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'refreshPage');
					}
				},
				{
					label: 'Find in Page',
					accelerator: 'CmdOrCtrl+F',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'findInPage');
					}
				}
			]
		},
		{
			label: 'Tabs',
			submenu: [
				{
					label: 'Next Tab',
					accelerator: 'CmdOrCtrl+Tab',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'nextTab');
					}
				},
				{
					label: 'Previous Tab',
					accelerator: 'CmdOrCtrl+Shift+Tab',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'backTab');
					}
				},
				{
					label: 'New Tab',
					accelerator: 'CmdOrCtrl+T',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'newTab');
					}
				},
				{
					label: 'Close Tab',
					accelerator: 'CmdOrCtrl+W',
					click: async () => {
						mainWindow.webContents.send('keyboardShortcut', 'closeTab');
					}
				}
			]
		}
];

const { join } = require("path");

const settingsFile = join(__dirname, "data/settings.json");

const server = require('child_process').fork(__dirname + '/server.js');

const { existsSync, readFile, writeFile } = require('fs');

const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const { fetch } = require('cross-fetch');

// Quit server process if main app will quit
app.on('will-quit', async () => {
	server.send('quit');
});

server.on('message', async (m) => {
	authCallback(m.authResponse)
});

require('jsonfile').readFile(settingsFile, async (err, obj) => {
	let dl = require('electron-dl');
	if(obj.save_location === "Use Save As Window"){
		dl({saveAs: true});
	} else if (obj.save_location === "Downloads"){
		dl({saveAs: false});
	} else {
		console.error("ERROR");
	}
});
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

ipcMain.on('adblock-change', (event, arg) => {
	var data = arg.split(":");
	if (data[1] === "on") {
		enableAdBlocking();
	} else if (data[1] === "off") {
		disableAdBlocking();
	}
});

ipcMain.on('openPage', (event, arg) => {
	mainWindow.webContents.send('openPage', arg);
});

ipcMain.on('signIntoBlockstack', (e, a) => {
	mainWindow.webContents.send('keyboardShortcut','signIntoBlockstack');
});

async function authCallback(authResponse) {
	// Bring app window to front
	mainWindow.focus();

	let { decodeToken } = require('blockstack');
	const token = decodeToken(authResponse);
	mainWindow.webContents.send('blockstackSignIn', authResponse);
};

async function enableAdBlocking() {
	console.time("Adblocker load time");

	if (existsSync(join(__dirname, 'data/blocker.txt'))) {
		readFile(join(__dirname, 'data/blocker.txt'), async (err, contents) => {
			if (err) throw err;

			let data;
			if(typeof contents === 'string') { data = Buffer.from(contents); } else if (Buffer.isBuffer(contents)) { data = contents; }
			else { console.log(typeof contents); }

			const blocker = ElectronBlocker.deserialize(data);

			blocker.enableBlockingInSession(session.fromPartition("persist:peacock"));
			blocker.on('request-blocked', async (request) => {
		    mainWindow.webContents.send('ad-blocked', request);
		  });

			console.timeEnd("Adblocker load time");
		});
	} else {
		ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
			blocker.enableBlockingInSession(session.fromPartition("persist:peacock"));
			blocker.on('request-blocked', async (request) => {
		    mainWindow.webContents.send('ad-blocked', request);
		  });
			const buffer = blocker.serialize();
			writeFile(join(__dirname, 'data/blocker.txt'), buffer, async (err) => {
				if (err) throw err; console.log('Peacock Shield serialized.'); console.timeEnd("Adblocker load time"); });
		});
	}
}

async function disableAdBlocking() {
	if (existsSync(join(__dirname, 'data/blocker.txt'))) {
		readFile(join(__dirname, 'data/blocker.txt'), async (err, contents) => {
			if (err) throw err;

			let data;
			if(typeof contents === 'string') { data = Buffer.from(contents); } else if (Buffer.isBuffer(contents)) { data = contents; }
			else { console.log(typeof contents); }

			const blocker = ElectronBlocker.deserialize(data);

			blocker.disableBlockingInSession(session.fromPartition("persist:peacock"));
		});
	} else {
		ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
			blocker.disableBlockingInSession(session.fromPartition("persist:peacock"));
			const buffer = blocker.serialize();
			writeFile(join(__dirname, 'data/blocker.txt'), buffer, async (err) => {
				if (err) throw err; console.log('Peacock Shield serialized.'); });
		});
	}
}

async function createWindow() {
	// Create the browser window.
	var screenSize = screen.getPrimaryDisplay().size;

  mainWindow = new BrowserWindow({
		title: 'Peacock',
		backgroundColor: '#002b36',
		frame: false,
		minWidth: 500,
    minHeight: 450,
		titleBarStyle: 'hiddenInset',
		backgroundColor: '#FFF',
		webPreferences: {
			nodeIntegration: true,
      contextIsolation: false,
      experimentalFeatures: true,
      enableBlinkFeatures: 'OverlayScrollbars',
      webviewTag: true,
			allowRunningInsecureContent: true
		},
		width: screenSize.width,
		height: screenSize.height,
		icon: join(__dirname, 'images/peacock.ico')
	});

	mainWindow.on('focus', async () => { mainWindow.webContents.send('loadTheme', ''); });

	Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

	enableAdBlocking();

	if(!app.isDefaultProtocolClient('peacock')) { app.setAsDefaultProtocolClient('peacock') };

	// const extensions = new ExtensibleSession(session.defaultSession);
	// extensions.loadExtension('Grammarly'); // Path to the extension to load

	// and load the index.html of the app.
	let { format } = require('url');
	mainWindow.loadURL(format({
		pathname: join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));

	mainWindow.maximize();

	mainWindow.webContents.on('crashed', async () => {
		require('electron-unhandled').logError("Peacock has crashed. 😢");
	});

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', async () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	// mainWindow.once('did-finish-load', () => {
	// 	session.fromPartition("persist:peacock").webRequest.onBeforeSendHeaders({ urls: ["http://*/*", "https://*/*"] }, (details, callback) => {
	// 		details.requestHeaders['DNT'] = "1";
	// 		callback({
	// 			cancel: false,
	// 			requestHeaders: details.requestHeaders
	// 		})
	// 	});
	//
	// 	session.fromPartition("persist:peacock").setPermissionRequestHandler((webContents, permission, callback) => {
	// 		const url = webContents.getURL();
	//
	// 		console.log(permission);
	// 		callback({ cancel: true	});
	// 	});
	//
	// 	session.fromPartition("persist:peacock").on('will-download', (event, item, webContents) => {
	// 		event.preventDefault();
	// 		console.log("DOWNLOADING " + item.getURL());
	// 	});
	// });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', async () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		if (mainWindow) {
			mainWindow.webContents.closeDevTools()
		}
		app.quit()
	}
});

app.on('web-contents-created', async (e, contents) => {
  if (contents.getType() == 'webview') {
    require('electron-context-menu')({
      window: contents,
			prepend: (defaultActions, params, browserWindow) => [
				{
					label: 'View Image',
					visible: params.mediaType === 'image',
					click: async () => { mainWindow.send('loadPage', params.srcURL); }
				},
				{
					label: 'Open Link in New Tab',
					visible: params.linkURL.length > 0,
					click: async () => {
						mainWindow.webContents.send('openPage', params.linkURL);
					}
				},
				{
					label: 'Search Google for “{selection}”',
					// Only show it when right-clicking text
					visible: params.selectionText.trim().length > 0,
					click: async () => { mainWindow.send('loadPage', `https://google.com/search?q=${encodeURIComponent(params.selectionText)}`); }
				}
			],
			showLookUpSelection: true,
      showCopyImageAddress: true,
			showSaveImageAs: true,
			showInspectElement: true
    });
		mainWindow.webContents.send('nativeTheme', nativeTheme.shouldUseDarkColors);
  }
});

app.on('activate', async () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

app.on('session-created', async (newSession) => {
  newSession.webRequest.onBeforeSendHeaders(async (details, callback) => {
		const requestHeaders = {
			['DNT']: '1',
			['User-Agent']: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36'
		};
    callback({ cancel: false, requestHeaders: requestHeaders });
  });

	newSession.setPermissionRequestHandler(async (webContents, permission, callback) => {
    console.log(permission);
    callback(false);
  });
});

app.on('certificate-error', async (event, webContents, url, error, certificate, callback) => {
  console.log("! url: " + url + "| issuerName: " + certificate.issuerName);
  event.preventDefault();
  callback(true);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
