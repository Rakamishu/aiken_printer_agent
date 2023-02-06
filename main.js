const { app, BrowserWindow, ipcMain } = require('electron')
// require('electron-debug')({ showDevTools: true });
const fetch = require('node-fetch')
const path = require("path")
const fs = require('fs');
const request = require('request');
const { exec } = require('child_process');

const printerName = 'DefaultLabel';
const printerGradeA = 'PrinterGradeA';
const printerGradeAminus = 'PrinterGradeA-';
const printerGradeB = 'PrinterGradeB';
// const printerGradeAminus = 'PrinterGradeA';
// const printerGradeB = 'PrinterGradeA';

const createWindow = () => {
    const win = new BrowserWindow({
        width: 500,
        height: 570,
        webPreferences: {
            backgroundThrottling: false,
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
            contextIsolation: false,
            plugins: true,
        },
        icon: path.join(__dirname, "icon.png")
    });
    win.loadFile('index.html');
    win.webContents.on('did-finish-load', () => {
        win.webContents.getPrintersAsync().then((printers) => {
            win.webContents.send('printers', printers);
        });
    });
    win.setMenuBarVisibility(false);
};

app.whenReady().then(() => {

    //get sumatra exe location
    const sumatrapdf = path.join(__dirname, 'SumatraPDF/SumatraPDF-3.4.6-64.exe');
    //define empty array
    let users = [];
    //receive selected users from index.html
    ipcMain.on('message-users', (event, arg) => { users = arg; }) 
    
    fetch("http://192.168.0.199/Modules/online_aiken/print/last_unitid.php", { cache: 'no-cache' }).then(function (response) {
        return response.text();
    }).then(function (html) {
        const last_unitid = JSON.parse(html)

        //maintains the loop by executing itself if nothing to print
        setTimeout(async function listener() {
            if (users.length > 0) {
                console.log(users); //debug
                let exit = false; //if false -> keep looping

                //async loop through all selected users
                for (i = 0; i < users.length; i++) {
                    
                    await fetch(`http://192.168.0.199/Modules/online_aiken/print/listener.php?user=${users[i]}&start=${last_unitid}`)
                        .then(res => res.json())
                        .then(json => {
                            if (json.response && json.response != 'null') { //found something to print
                                console.log(json, '\n-----------'); //debug
                                console.log('found. print'); //debug

                                //download the file
                                const fileUrl = `http://192.168.0.199/Modules/online_aiken/print/templates/${json.next_for_print_format}.php?uid=${json.UnitID}&register=1`; 
                                const localFile = './label.pdf';

                                let small_label = false;
                                if (json.next_for_print_format == "laptops") small_label = true;

                                const streamLabel = fs.createWriteStream(localFile);
                                request(fileUrl)
                                    .pipe(streamLabel)
                                    .on('finish', async () => {  //download complete. proceed to print
                                        streamLabel.close();

                                        exec(`start ${sumatrapdf} -print-to "${printerName}" "${localFile}"`, (error, stdout, stderr) => {
                                            if (error) {
                                                console.error(`Error: ${error}`)
                                                return
                                            }
                                            console.log('print successful');

                                            if (!small_label) {
                                                setTimeout(listener, 3000);
                                            } else {
                                                //download the file
                                                const fileUrl_small = `http://192.168.0.199/Modules/online_aiken/print/templates/sn2barcode.php?uid=${json.UnitID}`;
                                                const localFile_small = './label_small.pdf';
                                                const streamLabel_small = fs.createWriteStream(localFile_small);
                                                request(fileUrl_small)
                                                    .pipe(streamLabel_small)
                                                    .on('finish', async () => {  //download complete. proceed to print
                                                        streamLabel_small.close();

                                                        let to_printer = printerGradeA
                                                        switch (json.product_grade) {
                                                            case 'A':
                                                                to_printer = printerGradeA
                                                                break
                                                            case 'A-':
                                                                to_printer = printerGradeAminus
                                                                break
                                                            case 'B':
                                                                to_printer = printerGradeB
                                                                break
                                                        }

                                                        exec(`start ${sumatrapdf} -print-to "${to_printer}" -print-settings "landscape" "${localFile_small}"`, (error, stdout, stderr) => {
                                                            if (error) {
                                                                console.error(`Error: ${error}`)
                                                                return
                                                            }
                                                            console.log('print small successful');
                                                            setTimeout(listener, 3000);
                                                        });
                                                    });
                                            }
                                        });
                                    });
                                
                                //pause the loop and let it be started again on successful print. 
                                exit = true
                                return false
                            }
                        })
                        .catch(error => console.error(error));
                
                    if (exit) return false;                    
                }
            }
            setTimeout(listener, 3000);
        }, 3000);
    });
    
    createWindow();
});
  