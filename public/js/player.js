document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audioPlayer');
    const playButtons = document.querySelectorAll('.play-beat-btn'); // Todos os botões de play/ouvir
    const currentBeatTitleSpan = document.getElementById('currentBeatTitle');

    let currentPlayingButton = null; // Para controlar qual botão está ativo (play/pause)

    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            const audioUrl = button.dataset.audioUrl;
            const beatTitle = button.closest('.beat-card').querySelector('h3').textContent; // Pega o título do beat

            // Se o mesmo beat estiver tocando e o botão for clicado, pausa/retoma
            if (audioPlayer.src === window.location.origin + audioUrl) {
                if (audioPlayer.paused) {
                    audioPlayer.play();
                    // Atualiza o ícone do botão clicado para pause
                    button.querySelector('i').classList.remove('fa-play');
                    button.querySelector('i').classList.add('fa-pause');
                } else {
                    audioPlayer.pause();
                    // Atualiza o ícone do botão clicado para play
                    button.querySelector('i').classList.remove('fa-pause');
                    button.querySelector('i').classList.add('fa-play');
                }
            } else {
                // Se um beat diferente for clicado, para o anterior e toca o novo
                // Reseta o ícone do botão anterior (se houver)
                if (currentPlayingButton && currentPlayingButton !== button) {
                    currentPlayingButton.querySelector('i').classList.remove('fa-pause');
                    currentPlayingButton.querySelector('i').classList.add('fa-play');
                }

                audioPlayer.src = audioUrl;
                audioPlayer.play();

                // Atualiza o ícone do botão atual para pause
                button.querySelector('i').classList.remove('fa-play');
                button.querySelector('i').classList.add('fa-pause');
                
                currentBeatTitleSpan.textContent = beatTitle; // Atualiza o título tocando
                currentPlayingButton = button; // Armazena o botão que está tocando
            }
        });
    });

    // Event listener para quando a música termina
    audioPlayer.addEventListener('ended', () => {
        if (currentPlayingButton) {
            // Reseta o ícone do botão para play
            currentPlayingButton.querySelector('i').classList.remove('fa-pause');
            currentPlayingButton.querySelector('i').classList.add('fa-play');
            currentPlayingButton = null;
        }
        currentBeatTitleSpan.textContent = 'Nenhum beat'; // Reseta o título
    });

    // Event listener para quando o player é pausado via controles nativos
    audioPlayer.addEventListener('pause', () => {
        if (currentPlayingButton) {
            currentPlayingButton.querySelector('i').classList.remove('fa-pause');
            currentPlayingButton.querySelector('i').classList.add('fa-play');
        }
    });

    // Event listener para quando o player é iniciado via controles nativos (se for o caso)
    audioPlayer.addEventListener('play', () => {
        // Se um novo play começa (e não é uma retomada), resetar outros botões
        playButtons.forEach(button => {
            const buttonAudioUrl = button.dataset.audioUrl;
            if (audioPlayer.src.includes(buttonAudioUrl) && currentPlayingButton !== button) {
                if (currentPlayingButton) {
                    currentPlayingButton.querySelector('i').classList.remove('fa-pause');
                    currentPlayingButton.querySelector('i').classList.add('fa-play');
                }
                button.querySelector('i').classList.remove('fa-play');
                button.querySelector('i').classList.add('fa-pause');
                currentPlayingButton = button;
                currentBeatTitleSpan.textContent = button.closest('.beat-card').querySelector('h3').textContent;
            }
        });
    });
});