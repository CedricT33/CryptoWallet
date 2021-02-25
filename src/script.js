/** ----- VALUES ------ */
var version = '';
var storage = [];

/**
 * AFFICHE LA PRESENTATION DE L'APPLI SI LE LOCALSTORAGE EST VIDE
 */
function gestionAffichagePresentation() {
    var elmtFleche = document.getElementById('fleche-presentation');
    var elmtPresentation = document.getElementById('presentation-container');

    if (!storage || storage.length == 0) {
        elmtFleche.classList.remove('hide');
        elmtPresentation.classList.remove('hide');
    }
    else {
        elmtFleche.classList.add('hide');
        elmtPresentation.classList.add('hide');
    }
}

/**
 * LANCE LES FONCTIONS DE DEMARRAGE DE L'APP
 */
function onDocumentReady() {
    gestionAffichagePresentation();
}

/** -----AU CHARGEMENT DU DOM----- */
document.onload = onDocumentReady();
