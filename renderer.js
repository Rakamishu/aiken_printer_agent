const { ipcRenderer } = require('electron')


let windowTopBar = document.createElement('div')
    windowTopBar.style.width = "100%"
    windowTopBar.style.height = "32px"
    windowTopBar.style.backgroundColor = "transparent"
    windowTopBar.style.position = "absolute"
    windowTopBar.style.top = windowTopBar.style.left = 0
    windowTopBar.style.webkitAppRegion = "drag"
    document.body.appendChild(windowTopBar)

const printerDefault = document.getElementById('printerDefault')
const printerGradeA  = document.getElementById('printerGradeA')
const printerGradeAm = document.getElementById('printerGradeAm')
const printerGradeB  = document.getElementById('printerGradeB')
const printerDefaultOrientation = document.getElementById('printerDefaultOrientation')

fetch('http://192.168.0.199/Modules/online_aiken/print/users.php', { cache: 'no-cache' }).then(function (response) {
	return response.text()
}).then(function (html) {
    const users = JSON.parse(html)
    let users_container = document.getElementById('users')
    users_container.innerHTML = ''
    users.forEach((element, key) =>
        users_container.innerHTML = users_container.innerHTML + `<input type="checkbox" class="btn-check" id="${element}" autocomplete="off" name="user" value="${element}"><label class="btn btn-outline-primary" for="${element}">${element}</label>`
    );

    const checkboxes = document.querySelectorAll('input[name="user"]')
    let selectedUsers
    if (localStorage.getItem('remembered')) {
        selectedUsers = JSON.parse(localStorage.getItem('remembered'))
    } else {
        selectedUsers = []
    }

    for (const user of selectedUsers) {
        document.getElementById(`${user}`).checked = true
    }
    //send at init
    ipcRenderer.send('users', selectedUsers)
    
    //update users array on change
    for (const checkbox of checkboxes) {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                selectedUsers.push(this.value)
            } else {
                selectedUsers = selectedUsers.filter(user => user !== this.value)
            }
            localStorage.setItem('remembered', '')
            localStorage.setItem('remembered', JSON.stringify(selectedUsers))

            ipcRenderer.send('users', selectedUsers)
        });
    }
    
}).catch(function (err) {
    console.warn('Can\'t get users.', err);
    document.getElementById('users').innerHTML = `<div class="alert alert-danger py-2"><i class="fa-solid fa-triangle-exclamation"></i> Неуспешно свързване със сървъра.</div>`
});


ipcRenderer.on('printers', (event, array) => {
    let printers;
    if (localStorage.getItem('printers')) {
        printers = JSON.parse(localStorage.getItem('printers'))
    }
    array.forEach((element, key) => {
        printerDefault.innerHTML = printerDefault.innerHTML + `<option value="${element['displayName']}">${element['displayName']}</option>`
        printerGradeA.innerHTML  = printerGradeA.innerHTML  + `<option value="${element['displayName']}">${element['displayName']}</option>`
        printerGradeAm.innerHTML = printerGradeAm.innerHTML + `<option value="${element['displayName']}">${element['displayName']}</option>`
        printerGradeB.innerHTML  = printerGradeB.innerHTML  + `<option value="${element['displayName']}">${element['displayName']}</option>`
    });

    let dropdowns = document.querySelectorAll('select')
    for (let i = 0; i < dropdowns.length; i++) {
        dropdowns[i].addEventListener('change', function () {
            ipcRenderer.send(this.name, this.value)
            localStorage.setItem(this.name, this.value);
        });
    }

    printerDefaultOrientation.addEventListener('change', function () {
        if (this.checked) {
            localStorage.setItem('printerDefaultOrientation', 'landscape')
        } else {
            localStorage.setItem('printerDefaultOrientation', 'portrait')
        }
        ipcRenderer.send('printerDefaultOrientation', localStorage.getItem('printerDefaultOrientation'))
    })

    if (localStorage.getItem('printerDefault')) {
        document.getElementById('printerDefault').value = localStorage.getItem('printerDefault')
        ipcRenderer.send('printerDefault', localStorage.getItem('printerDefault'))
    }
    if (localStorage.getItem('printerGradeA')) {
        document.getElementById('printerGradeA').value = localStorage.getItem('printerGradeA')
        ipcRenderer.send('printerGradeA', localStorage.getItem('printerGradeA'))
    }
    if (localStorage.getItem('printerGradeAm')) {
        document.getElementById('printerGradeAm').value = localStorage.getItem('printerGradeAm')
        ipcRenderer.send('printerGradeAm', localStorage.getItem('printerGradeAm'))
    }
    if (localStorage.getItem('printerGradeB')) {
        document.getElementById('printerGradeB').value = localStorage.getItem('printerGradeB')
        ipcRenderer.send('printerGradeB', localStorage.getItem('printerGradeB'))
    }
    if (localStorage.getItem('printerDefaultOrientation')) {
        ipcRenderer.send('printerDefaultOrientation', localStorage.getItem('printerDefaultOrientation'))
        if (localStorage.getItem('printerDefaultOrientation') == 'landscape') {
            printerDefaultOrientation.checked = true;
        }
    }
});

//activating bootstrap tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})