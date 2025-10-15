document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // 1. Coleta dos dados a partir dos atributos data-* do botão
            
            // O HTML no index.ejs agora garante que o data-price use o ponto (.),
            // mas mantemos a verificação robusta para caso haja erro na formatação do backend.
            const rawPrice = button.dataset.price;
            const priceValue = parseFloat(rawPrice); // Converte preço para número imediatamente

            const beatData = {
                id: button.dataset.id,
                title: button.dataset.title,
                artist: button.dataset.artist,
                price: priceValue, // Agora é um número
                cover: button.dataset.cover || '/img/placeholder-cover.jpg'
            };

            // EXTREMAMENTE CRÍTICO: DEBUG
            console.log('--- DADOS RECEBIDOS DO BEAT ---');
            console.log('ID:', beatData.id);
            console.log('Título:', beatData.title);
            console.log('Preço (FLOAT):', beatData.price);
            console.log('------------------------------');

            // 2. Verifica se algum dado crucial está faltando ANTES de enviar
            // O beat só é válido se tiver ID, Título e Preço numérico maior que 0.
            if (!beatData.id || !beatData.title || isNaN(beatData.price) || beatData.price <= 0) {
                console.error('ERRO FATAL: Dados ausentes ou inválidos no beat. BeatData:', beatData);
                alert('Não foi possível adicionar o beat. Preço inválido ou dados faltando. Verifique se o preço é > R$ 0.00.');
                return;
            }

            try {
                // 3. Envio dos dados para a rota do servidor
                const response = await fetch('/carrinho/adicionar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(beatData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert(`"${beatData.title}" adicionado ao carrinho! Total de itens: ${result.cartCount}`); 
                    console.log('Carrinho atualizado:', result);
                } else {
                    alert(`Erro ao adicionar: ${result.message}`);
                }

            } catch (error) {
                console.error('Erro de rede ao adicionar ao carrinho:', error);
                alert('Erro de conexão com o servidor. Tente novamente.');
            }
        });
    });
});
