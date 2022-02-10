
const p1 = document.createElement('p');
p1.appendChild(document.createTextNode('This page has replaced one that was playing media while you were idle.'));
document.body.appendChild(p1);

const p2 = document.createElement('p');
p2.appendChild(document.createTextNode('You may press the 🔙 Back button or click this link to return to that page: '));
    const a = document.createElement('a');
    a.href = window.location.hash.substring(1);
    a.addEventListener('click', e => {
        e.preventDefault();
        window.history.back();
    });
    a.appendChild(document.createTextNode(window.location.hash.substring(1)));
    p2.appendChild(a);
document.body.appendChild(p2);

const p3 = document.createElement('p');
p3.appendChild(document.createTextNode(new Date().toLocaleString()));
document.body.appendChild(p3);
