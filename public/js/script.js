document.addEventListener('DOMContentLoaded', () => {
    console.log('Script TROBeats carregado!');

    // Exemplo: Adicionar funcionalidade de play/pause aos botões de play
    const playButtons = document.querySelectorAll('.beat-card .btn-icon .fa-play');

    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            const beatCard = button.closest('.beat-card');
            const beatTitle = beatCard.querySelector('h3').textContent;
            // Aqui você faria a lógica real para reproduzir o beat
            // Por exemplo, buscar a URL do áudio e tocar.
            alert(`Reproduzindo: "${beatTitle}" (Funcionalidade de áudio a ser implementada!)`);
            // Em um app real, você criaria e controlaria um elemento <audio>
        });
    });

    // Exemplo: Adicionar funcionalidade de adicionar ao carrinho/download
    const downloadButtons = document.querySelectorAll('.beat-card .btn-icon .fa-download');

    downloadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const beatCard = button.closest('.beat-card');
            // beatId seria passado como um data-attribute no HTML, ex: <div class="beat-card" data-beat-id="<%= beat.id %>">
            const beatId = beatCard.dataset.beatId;
            const beatTitle = beatCard.querySelector('h3').textContent;
            // Aqui você faria a lógica real para adicionar ao carrinho ou iniciar download
            // Ex: fetch('/api/add-to-cart', { method: 'POST', body: JSON.stringify({ beatId: beatId }) })
            alert(`"${beatTitle}" adicionado ao carrinho! (Lógica de carrinho a ser implementada!)`);
        });
    });

    // Você pode adicionar mais funcionalidades aqui:
    // - Abrir/fechar menus responsivos em telas pequenas (se não for feito puramente com CSS)
    // - Validação de formulários
    // - Interações mais complexas com a UI
});