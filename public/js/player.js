document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = playPauseBtn.querySelector('i');
    const progressBar = document.getElementById('progress');
    const playerBeatTitle = document.getElementById('playerBeatTitle');
    const playerBeatArtist = document.getElementById('playerBeatArtist');
    const cardPlayButtons = document.querySelectorAll('.play-beat-btn');
    
    let currentPlayingButton = null;

    const togglePlayPause = (button) => {
        // Assume que o data-audio-url agora contém o BeatID completo, que é o nome do arquivo.
        // O app.js usará este ID para construir a URL protegida /play-beat/:beatId
        const beatId = button.dataset.beatId; 
        const audioUrl = `/play-beat/${beatId}`; // Cria a URL segura
        const beatTitle = button.dataset.beatTitle;
        const beatArtist = button.dataset.beatArtist;
        
        // Verifica se a URL de áudio está sendo construída corretamente
        if (!beatId) {
             console.error("Erro: Botão de play sem 'data-beat-id'.");
             return;
        }

        // Se o mesmo beat estiver tocando
        if (audioPlayer.src === window.location.origin + audioUrl) {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseIcon.classList.replace('fa-play', 'fa-pause');
                button.querySelector('i').classList.replace('fa-play', 'fa-pause');
            } else {
                audioPlayer.pause();
                playPauseIcon.classList.replace('fa-pause', 'fa-play');
                button.querySelector('i').classList.replace('fa-pause', 'fa-play');
            }
        } else {
            // Se um beat diferente for clicado
            if (currentPlayingButton) {
                currentPlayingButton.querySelector('i').classList.replace('fa-pause', 'fa-play');
            }

            audioPlayer.src = audioUrl; // Define a nova URL segura
            audioPlayer.play();
            playerBeatTitle.textContent = beatTitle;
            playerBeatArtist.textContent = beatArtist;

            playPauseIcon.classList.replace('fa-play', 'fa-pause');
            button.querySelector('i').classList.replace('fa-play', 'fa-pause');
            
            currentPlayingButton = button;
        }
    };

    // Event listener para os botões dos cards
    cardPlayButtons.forEach(button => {
        button.addEventListener('click', () => {
            togglePlayPause(button);
        });
    });

    // Event listener para o botão de play/pause do player fixo
    playPauseBtn.addEventListener('click', () => {
        if (currentPlayingButton) {
            togglePlayPause(currentPlayingButton);
        } else if (audioPlayer.src) {
            audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
             // Sincroniza o ícone do player fixo
            if (audioPlayer.paused) {
                playPauseIcon.classList.replace('fa-pause', 'fa-play');
            } else {
                playPauseIcon.classList.replace('fa-play', 'fa-pause');
            }
        }
    });

    // Atualiza a barra de progresso
    audioPlayer.addEventListener('timeupdate', () => {
        const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
    });

    // Reseta o player quando a música termina
    audioPlayer.addEventListener('ended', () => {
        playPauseIcon.classList.replace('fa-pause', 'fa-play');
        if (currentPlayingButton) {
             currentPlayingButton.querySelector('i').classList.replace('fa-pause', 'fa-play');
        }
        currentPlayingButton = null;
        progressBar.style.width = '0%';
        playerBeatTitle.textContent = 'Nenhum beat';
        playerBeatArtist.textContent = '';
    });
});
