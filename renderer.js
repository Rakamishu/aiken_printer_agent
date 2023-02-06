const { ipcRenderer } = require('electron');

fetch('http://192.168.0.199/Modules/online_aiken/print/users.php', { cache: 'no-cache' }).then(function (response) {
	return response.text();
}).then(function (html) {
    const users = JSON.parse(html)
    let users_container = document.getElementById('users');
    users.forEach((element, key) =>
        users_container.innerHTML = users_container.innerHTML + `<input type="checkbox" class="btn-check" id="${element}" autocomplete="off" name="user" value="${element}"><label class="btn btn-outline-primary" for="${element}">${element}</label>`
    );

    const checkboxes = document.querySelectorAll('input[name="user"]')
    let selectedUsers = []
    if (localStorage.getItem('remembered')) {
        selectedUsers = JSON.parse(localStorage.getItem('remembered'))
    }
    
    for (const user of selectedUsers) {
        document.getElementById(`${user}`).checked = true
    }

    for (const checkbox of checkboxes) {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                selectedUsers.push(this.value)
            } else {
                selectedUsers = selectedUsers.filter(user => user !== this.value)
            }
            localStorage.setItem('remembered', '')
            localStorage.setItem('remembered', JSON.stringify(selectedUsers))

            ipcRenderer.send('message-users', selectedUsers)
        });
    }
    
}).catch(function (err) {
	console.warn('Can\'t get users.', err);
});


ipcRenderer.on('printers', (event, array) => {
    array.forEach((printer, index, array) => {
        let check = document.querySelector(`#${(printer['displayName']).replace(/[^\w\s]|\d/gi, '').replace(/\s+/g, '_').trim()} span`);
        if (check) {
            check.innerHTML = "✔";
        }
    });
});
