// window.addEventListener('DOMContentLoaded', () => {
//     const replaceText = (selector, text) => {
//       const element = document.getElementById(selector)
//       if (element) element.innerText = text
//     }
  
//     for (const type of ['chrome', 'node', 'electron']) {
//       replaceText(`${type}-version`, process.versions[type])
//     }
// })
  

// fetch(`http://192.168.0.199/Modules/online_aiken/print/users.php`) //todo: get the latest unitid when printer agent is started
// .then(res => res.json())
// .then(json => {
//   console.log(json);
//   json.forEach(element => console.log(element));
// });