window.onload = function() {
	var liensProjets = document.getElementsByClassName('projets');
	var nomProjet = document.getElementById('nom-projet');
	for (var i=0; i < liensProjets.length; i++) {
		liensProjets[i].addEventListener('mouseover', function() {
			var projetId = this.dataset.numero;
			nomProjet.innerHTML = this.dataset.nom;
			nomProjet.className = "";

		});
		liensProjets[i].addEventListener('mouseout', function() {
			nomProjet.className = "hidden";
		});
	}
}