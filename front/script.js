// Sélection des éléments
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');


//modal image
const imageModal = document.getElementById('imageModal');
const modalImagePreview = document.getElementById('modalImagePreview');
const modalImageName = document.getElementById('modalImageName');
const closeBtn = document.querySelector('.close-btn')

//modal gestion
const gestionModal = document.getElementById('gestionModal');
const closeGesBtn = document.querySelector('.closeGes-btn');
const listImage = document.getElementById('listImage');


const MAX_SIZE = 5 * 1024 * 1024; // 5MB

let files = []; // liste temporaire des fichiers choisis

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    // console.log(e.dataTransfer.files);
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    // console.log(e.target.files);
    handleFiles(e.target.files);
});

function handleFiles(selectedFiles) {
    [...selectedFiles].forEach(file => {
        const isImage = file.type.startsWith('image/');
        const isTooBig = file.size > MAX_SIZE;

        if (!isImage) {
            alert(`Le fichier ${file.name} n'est pas une image.`);
            return;
        }

        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        if (isTooBig) fileItem.classList.add('error');

        const fileName = document.createElement('span');
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileLabels = file.name.split('.')[0];
        fileName.innerHTML = `<u>${fileLabels}</u> - (${fileExt}  |  ${fileSizeMB}  MB)`;

        const progressContainer = document.createElement('div');
        progressContainer.classList.add('progress-container');

        const progressBar = document.createElement('div');
        progressBar.classList.add('progress-bar');
        progressContainer.appendChild(progressBar);

        fileItem.appendChild(fileName);
        fileItem.appendChild(progressContainer);

        const warn = document.createElement('span');
        warn.style.width = "100%";
        warn.style.textAlign = 'right';
        warn.style.marginTop = '8px';

        if (isTooBig) {
            warn.textContent = ' ⚠ Taille élevée (supérieur à 5 MB)';
            warn.style.color = 'rgba(255, 0, 0, 0.6)';
        } else {
            warn.textContent = 'Valide (cliquez sur Uploader)';
            warn.style.color = '#aaa';
        }

        fileItem.appendChild(warn);
        fileList.appendChild(fileItem);

        files.push({ file, progressBar, isTooBig, warn }); // 👈 on stocke warn ici
    });
}

uploadBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!files.length) {
            alert('Veuillez sélectionner des images.');
            return;
        }

        for (const item of files) {
            const { file, progressBar, isTooBig, warn } = item;
            if (isTooBig) continue;

            const formData = new FormData();
            formData.append('images', file);

            try {
                const url = await uploadWithProgress(formData, progressBar);

                // ✅ Mise à jour du texte après upload réussi
                // warn.innerHTML = `✔ <span style="color:#0098c1">Terminée</span> 
                // (<a href="${url}" target="_blank" style="color:#0098c1; text-decoration:underline;">voir un aperçu</a>)`;

                // Nouveau code :
                const fileNameOnly = file.name.split('.').slice(0, -1).join('.'); // Nom sans extension
                warn.innerHTML = `✔ <span style="color:#0098c1">Terminé</span> 
                (<span class="preview-link" style="color:#0098c1; text-decoration:underline; cursor:pointer;">voir un aperçu</span>)`;

                // IMPORTANT : Attacher l'écouteur d'événement au lien "voir un aperçu"
                const previewLink = warn.querySelector('.preview-link');
                previewLink.addEventListener('click', () => {
                    showImagePreview(url, fileNameOnly);
                });

                warn.style.color = "#0098c1"; // pour le reste du texte
            } catch (err) {
                console.error(err);
                progressBar.style.background = 'red';
                warn.textContent = "❌ Échec de l’upload";
                warn.style.color = "red";
            }
        }
    });



function simulateProgress(bar) {
    return new Promise(resolve => {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                resolve();
            } else {
                width += 5;
                bar.style.width = width + '%';
            }
        }, 100);
    });
}

function uploadWithProgress(formData, progressBar) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:3000/upload");

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressBar.style.width = percent + "%";
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const { url } = JSON.parse(xhr.responseText);
                progressBar.style.background = "#4CAF50"; // vert = ok
                resolve(url);
            } else {
                progressBar.style.background = "red";
                reject(new Error("Erreur serveur"));
            }
        };

        xhr.onerror = reject;
        xhr.send(formData);
    });


}


function showImagePreview(url, name) {
    modalImagePreview.src = url;
    modalImageName.innerHTML = `Image :  ${name}` ;
    imageModal.style.display = 'block'; // Affiche la modale
}

// Fermer en cliquant sur le "x"
closeBtn.addEventListener('click', () => {
    imageModal.style.display = 'none';
});


// Fermer en cliquant en dehors de la modale
window.addEventListener('click', (e) => {
    if (e.target === imageModal) {
        imageModal.style.display = 'none';
    }

    if (e.target === gestionModal) {
        gestionModal.style.display = 'none';
    }
});


const gestpopUp = document.querySelector('.gest-pop-up');
gestpopUp.addEventListener('click', () => {
    showGestPreview();
    // alert("AZER");
});

// ✅ Fonction pour ouvrir la modale
function showGestPreview() {
    gestionModal.style.display = 'block';
    fetchImages();
}

closeGesBtn.addEventListener('click', () => {
    gestionModal.style.display = 'none';
});


// 🧩 Charger les images depuis le serveur
async function fetchImages() {
    try {
        const res = await fetch('http://localhost:3000/images');
        const images = await res.json();

        if (!images.length) {
            listImage.innerHTML = "<p style='text-align:center;color:#999;'>Aucune image enregistrée.</p>";
            return;
        }

        listImage.innerHTML = `
            <div class="image-list">
                ${images.map(img => `
                    <div class="image-card" data-id="${img.id}">
                        <img src="${img.url}" alt="${img.file_name}">
                        <div class="image-info">
                            <strong>${img.file_name}</strong><br>
                            <small>${(img.taille / 1024).toFixed(1)} KB</small><br>
                            <small>${img.width}x${img.height}px</small><br>
                            <div style='display: flex; justify-content: center; align-item: center'>
                                <button class="delete-btn" onclick="deleteImage(${img.id})">Supprimer</button>
                                <button class="telecharger-btn" onclick="downloadImage('${img.url}', '${img.file_name}')">
                                    Télécharger
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error(err);
        listImage.innerHTML = "<p style='color:red;text-align:center;'>Erreur de chargement des images.</p>";
    }
}

// 🗑️ Supprimer une image
async function deleteImage(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette image ?")) return;

    try {
        const res = await fetch(`http://localhost:3000/images/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (data.success) {
            alert("Image supprimée !");
            fetchImages(); // recharge la liste
        } else {
            alert("Erreur lors de la suppression.");
        }
    } catch (err) {
        console.error(err);
        alert("Erreur de communication avec le serveur.");
    }
}

async function downloadImage(url, fileName) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur lors du téléchargement");

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // Nettoyage
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error("Erreur download :", err);
        alert("Impossible de télécharger l'image 😢");
    }
}
