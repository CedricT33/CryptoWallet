/** ----- VALUES ------ */
var version = '';
var storage = [];
var objetQuantiteCrypto = new Object();
var urlAPIBase = "https://min-api.cryptocompare.com/data/";
var ExTotalCrypto = 0;
var totalAchats = 0;
var totalCryptos = 0;

// Cryptos implémentées dans l'application
var cryptoMonnaies = {
    BTC: 'Bitcoin',
    ETH: 'Etherum',
    XRP: 'Ripple',
    BNB: 'Binance',
    AAVE: 'Aave'
}

/** ----- RECUPERATION DE LA VERSION DEPUIS LE SW ------ */
function getVersion() {
    const channel = new BroadcastChannel('sw-version');
    channel.addEventListener('message', event => {
        localStorage.setItem("version", event.data.version);
        console.log('récupération de la version : ', event.data.version);
    });
}

/**
 * AU CLICK SUR AJOUTER UN ACHAT (BOUTON +)
 */
function clickAjout() {
    propositionInstallationApp();
    faireApparaitrePageFormulaire(); 
}

/**
 * AU CLICK SUR RETOUR (BOUTON <)
 */
function clickRetour() {
    faireDisparaitrePageFormulaire();
}

/**
 * AU CLICK SUR OK DU FORMULAIRE D'ACHAT
 */
function clickOK() {
    var elemtIndex = document.getElementById('index').value;
    var saisieCrypto = document.getElementById('saisieCrypto').value;
    var saisieQuantite = document.getElementById('saisieQuantite').value;
    var saisieCours = document.getElementById('saisieCours').value;
    var saisieJour = document.getElementById('saisieJour').value;
    var saisieMois = document.getElementById('saisieMois').value;
    var saisieAnnee = document.getElementById('saisieAnnee').value;
    var totalAchat = 0;
    var nomCryptoComplet = cryptoMonnaies[saisieCrypto];

    if (saisieQuantite !== 0 && saisieCours !== 0) {
        totalAchat = saisieQuantite * saisieCours;
    }

    var objetAchat = {
        index: elemtIndex ? Number(elemtIndex) : recupererIndexMax(),
        crypto: saisieCrypto,
        crypto_complet: nomCryptoComplet,
        quantite: Number(saisieQuantite),
        cours: Number(saisieCours),
        total: totalAchat,
        jour: saisieJour,
        mois: saisieMois,
        annee: saisieAnnee
    };

    var controleOK = controleSaisie(objetAchat);

    if (controleOK) {
        ajoutLocalStorage(objetAchat);
        miseAJourPortefeuille();
        faireDisparaitrePageFormulaire();
        gestionAffichagePresentation(); 
    }
    else {
        //TODO -> popin erreur?
    }
}

/**
 * PROPOSE A L'UTILISATEUR D'INSTALLER L'APPLICATION SUR SON TEL
 */
function propositionInstallationApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
            console.log(choiceResult.outcome);

            if (choiceResult.outcome === 'dismissed') {
                console.log('User cancelled installation');
            }
            else {
                console.log('User added to home screen');
            }
        });
        deferredPrompt = null;
    }
}

/**
 * FAIT APPARAITRE LA PAGE D'AJOUT/MODIFICATION D'ACHAT
 */
function faireApparaitrePageFormulaire() {
    var elmtContainer = document.getElementById('container_principal');
    var elmtAjoutConteneur = document.getElementById('ajout-container');

    elmtContainer.classList.add('hide');
    elmtAjoutConteneur.classList.add('show');

    logiqueFormulaire()
}

/**
 * LOGIQUE DU FORMULAIRE (CALCUL DU TOTAL)
 */
function logiqueFormulaire() {
    var elmtQuantite = document.getElementById('saisieQuantite');
    var elmtCours = document.getElementById('saisieCours');
    var elmtTotal = document.getElementById('form_total');

    elmtQuantite.oninput = event => {
        if (elmtQuantite.value !== 0 && elmtCours.value !== 0) {
            elmtTotal.textContent = formatPrix(elmtQuantite.value * elmtCours.value);
        }
    }

    elmtCours.oninput = event => {
        if (elmtQuantite.value !== 0 && elmtCours.value !== 0) {
            elmtTotal.textContent = formatPrix(elmtQuantite.value * elmtCours.value);
        }
    }

    ajouterEcouteurDate();
}

/**
 * FORMATTE LE PRIX AVEC 2 CHIFFRES APRES LA VIRGULE
 * @param prix type Number
 * @returns prix formaté type String
 */
function formatPrix(prix) {
    if (prix) {
        return prix.toFixed(2).toString().replace('.', ',');
    }
    else {
        return 0;
    }
}

/**
 * NAVIGATION AUTO DANS LA DATE
 */
function ajouterEcouteurDate() {
    var elmtJour = document.getElementById('saisieJour');
    var elmtMois = document.getElementById('saisieMois');
    var elmtAnnee = document.getElementById('saisieAnnee');
    var btnOK = document.getElementById('btn-ok');

    elmtJour.onkeyup = event => {
        if (saisieJour.value.length >= 2) {
            elmtMois.focus();
        }
    }

    elmtMois.onkeyup = event => {
        if (elmtMois.value.length >= 2) {
            elmtAnnee.focus();
        }
    }

    elmtAnnee.onkeyup = event => {
        if (elmtAnnee.value.length >= 4) {
            btnOK.focus();
        }
    }
}

/**
 * FAIRE DISPARAITRE LA PAGE D'AJOUT/MODIFICATION D'ACHAT
 */
function faireDisparaitrePageFormulaire() {
    var elmtContainer = document.getElementById('container_principal');
    var elmtAjoutConteneur = document.getElementById('ajout-container');

    elmtContainer.classList.remove('hide');
    elmtAjoutConteneur.classList.remove('show');
    viderFormulaire();
}

/**
 * VIDE LE FORMULAIRE D'ACHAT
 */
function viderFormulaire() {
    var elmtFormulaire = document.getElementById('formulaire-container');
    var elmtTotal = document.getElementById('form_total');
    elmtTotal.textContent = 0;
    elmtFormulaire.reset();
}

/**
 * RETOURNE L'INDEX LE PLUS GRAND DE LA LISTE + 1
 */
function recupererIndexMax() {
    storage = JSON.parse(localStorage.getItem("achats"));
    var tableauIndex = [];
    if (!storage || storage.length === 0) {
        return 1;
    }
    else {
        storage.forEach(elmt => {
            tableauIndex.push(elmt.index);
        })
        return (Math.max(...tableauIndex) + 1);
    }
}

/**
 * CONTROLE DE SAISIE DU FORMULAIRE
 */
function controleSaisie(objetAchat) {
    if (objetAchat.crypto && 
        objetAchat.total !== 0 && 
        objetAchat.jour &&
        objetAchat.jour >= 1 &&
        objetAchat.jour <= 31 &&
        objetAchat.mois &&
        objetAchat.mois >= 1 &&
        objetAchat.mois <= 12 &&
        objetAchat.annee &&
        objetAchat.annee > 1900 &&
        objetAchat.annee <= new Date().getFullYear()) {

        objetAchat.jour = ('0' + objetAchat.jour).slice(-2);
        objetAchat.mois = ('0' + objetAchat.mois).slice(-2);
        return true
    }
    else {
        return false;
    }
}

/**
 * AJOUT DU NOUVEL ACHAT DANS LE LOCAL STORAGE
 */
function ajoutLocalStorage(objetAchat) {
    storage = JSON.parse(localStorage.getItem("achats"));
    // suppression de la donnée si elle existe
    if (storage) {
        storage.forEach( (elmt, id) => {
            if (elmt.index == objetAchat.index) {
                storage.splice(id, 1);
            }
        })
    }
    else {
        storage = [];
    }
    storage.push(objetAchat);
    localStorage.setItem("achats", JSON.stringify(storage));
}









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
 * CONSTRUIT UN ELEMENT HTML
 */
function creerElement(type, id, classes, content, attribut) {
    var newElmt = document.createElement(type);
    if (id !== 0) {
        newElmt.id = id;
    }
    if (classes !== '') {
        newElmt.className = classes;
    }
    if (content !== undefined) {
        var newContent = document.createTextNode(content);
        newElmt.appendChild(newContent);
    }
    if (attribut !== undefined) {
        newElmt.setAttribute('onclick', attribut);
    }

    return newElmt;
}

/**
 * CONSTRUIT UNE VIGNETTE COURS
 * @param crypto_nom type String
 * @param crypto_complet type String
 * @param cours type String
 */
function constructionVignetteCoursHTML(crypto_nom, crypto_complet, cours) {
    var elmtCoursConteneur = document.getElementById('cours_container');
    var elmtVignetteConteneur = creerElement('div', 0, 'vignette_cours');
    var elmtLogo = creerElement('div', 0, 'vignette_logo ' + crypto_nom);
    var elmtInfos = creerElement('div', 0, 'vignette_infos');
    var elmtNoms = creerElement('div', 0, 'vignette_noms');
    var elmtAcronymeCrypto = creerElement('div', 0, 'acronyme_crypto', crypto_nom);
    var elmtNomCrypto = creerElement('div', 0, 'nom_crypto', crypto_complet);
    var elmtPrixCrypto = creerElement('div', 0, 'vignette_prix', cours);
    
    elmtNoms.appendChild(elmtAcronymeCrypto);
    elmtNoms.appendChild(elmtNomCrypto);
    elmtInfos.appendChild(elmtNoms);
    elmtInfos.appendChild(elmtPrixCrypto);
    elmtVignetteConteneur.appendChild(elmtLogo);
    elmtVignetteConteneur.appendChild(elmtInfos);
    elmtCoursConteneur.appendChild(elmtVignetteConteneur);
}

/**
 * CREATION VIGNETTES COURS
 * @param objetCoursCryptos la réponse de l'API des cours de crypto en JSON
 */
function ajoutVignettesHTMLCours(objetCoursCryptos) {
    var crypto_nom = '';
    var crypto_complet = '';
    var cours = 0;

    for (const crypto in objetCoursCryptos) {
        crypto_nom = crypto;
        crypto_complet = cryptoMonnaies[crypto];
        cours = formatPrix(objetCoursCryptos[crypto].EUR) + " €";
        constructionVignetteCoursHTML(crypto_nom, crypto_complet, cours);
    }
}

/**
 * AFFICHAGE VIGNETTES COURS ET ACHATS
 * @param objetCoursCryptos la réponse de l'API des cours de crypto en JSON
 */
function affichageVignettes(objetCoursCryptos) {
    ajoutVignettesHTMLCours(objetCoursCryptos);
    //ajoutVignettesHTMLAchats();
}

/**
 * ANIMATION DES PRIX ET POURCENTAGES
 * @param obj type element du DOM
 * @param start type Number
 * @param end type Number
 * @param duration en millisecondes type Number
 * @param type 'pourcentage' ou 'prix' pour le symbole type String
 */
function animateValue(obj, start, end, duration, type) {
    let startTimestamp = null;
    let symbole = "";
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        type === "pourcentage" ? symbole = " %" : symbole = " €";
        obj.innerHTML = formatPrix(progress * (end - start) + start) + symbole;
        if (progress < 1) {
        window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * MISE A JOUR DU PORTEFEUILLE DANS LE TEMPLATE AVEC ANIMATION
 */
function miseAJourPortefeuilleTemplate() {
    var elmtPortefeuilleTotal = document.getElementById('total');
    var elmtPortefeuilleGains = document.getElementById('gains');
    var elmtPortefeuillePoucentage = document.getElementById('pourcentage');

    var gains = totalCryptos - totalAchats;
    var pourcentage = ((totalCryptos - totalAchats)*100)/totalAchats;

    animateValue(elmtPortefeuilleTotal, ExTotalCrypto, totalCryptos, 1000, "prix");
    animateValue(elmtPortefeuilleGains, 0, gains, 1000, "prix");
    animateValue(elmtPortefeuillePoucentage, 0, pourcentage, 1000, "pourcentage");
}

/**
 * CALCUL LE TOTAL EN EUROS DE LA SOMME DES CRYPTOS
 * @param objetCoursCryptos la réponse de l'API des cours de crypto en JSON
 */
function calculTotalCryptos(objetCoursCryptos) {
    for (const crypto in objetQuantiteCrypto) {
        objetTotalCrypto[crypto] = objetCoursCryptos[crypto].EUR * objetQuantiteCrypto[crypto];
    }
    console.log("objetTotalCrypto : ", objetTotalCrypto);
    for (const crypto in objetTotalCrypto) {
        totalCryptos += objetTotalCrypto[crypto];
    }
    console.log("totalCrypto : ", totalCryptos);
}

/**
 * APPEL API DE RECUPERATION DES COURS DE CRYPTO EN EURO
 * @param tableauCrypto
 * @returns objet JSON crypto:cours type Promise
 */
function recuperationCoursCryptos(tableauCrypto) {
    var cryptos = tableauCrypto.toString();
    return new Promise(function(resolve) {
        var urlAPI = urlAPIBase + "pricemulti?fsyms=" + cryptos + "&tsyms=EUR";
    
        ajaxGet(urlAPI, function (reponse) {
            resolve(JSON.parse(reponse));
        });
      });
}

/**
 * MET A JOUR LE PORTEFEUILLE
 */
function miseAJourPortefeuille() {
    // remise à 0 des variables globales
    ExTotalCrypto = totalCryptos;
    totalAchats = 0;
    totalCryptos = 0;
    objetQuantiteCrypto = new Object();
    objetTotalCrypto = new Object();

    if (storage) {
        storage.forEach( elmt => {
            totalAchats += elmt.total;
            if (Object.keys(objetQuantiteCrypto).indexOf(elmt.crypto) !== -1) {
                objetQuantiteCrypto[elmt.crypto] += elmt.quantite;
            }
            else {
                objetQuantiteCrypto[elmt.crypto] = elmt.quantite;
            }
        })
    }
    console.log("totalAchats : ", totalAchats);
    console.log("objectQuantiteCrypto : ", objetQuantiteCrypto);

    if (Object.keys(objetQuantiteCrypto).length !== 0) {
        recuperationCoursCryptos(Object.keys(objetQuantiteCrypto)).then(function(reponse) {
            console.log("réponse de l'API : ", reponse);
            calculTotalCryptos(reponse);
            miseAJourPortefeuilleTemplate();
            affichageVignettes(reponse);
        });
    }
}

/**
 * RECUPERE LE LOCAL STORAGE
 */
function recuperationLocalStorage() {
    storage = JSON.parse(localStorage.getItem("achats"));
}

/**
 * AJOUT DES CRYPTOS DANS LE SELECT DU FORMULAIRE D'ACHAT
 */
function ajoutCryptosFormulaire() {
    var saisieCrypto = document.getElementById('saisieCrypto');

    for (const crypto in cryptoMonnaies) {
        var newElmt = document.createElement('option');
        newElmt.textContent = crypto;
        newElmt.setAttribute('value', crypto);
        saisieCrypto.appendChild(newElmt);
    }
}

/**
 * LANCE LES FONCTIONS DE DEMARRAGE DE L'APP
 */
function onDocumentReady() {
    getVersion();
    ajoutCryptosFormulaire();
    recuperationLocalStorage();
    miseAJourPortefeuille();
    gestionAffichagePresentation();
}

/** -----AU CHARGEMENT DU DOM----- */
document.onload = onDocumentReady();
