document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const cartIcon = document.querySelector('.cart-icon .fas.fa-shopping-cart');

    function updateCartCount(count) {
        let cartCountSpan = cartIcon.querySelector('.cart-count');
        if (!cartCountSpan) {
            cartCountSpan = document.createElement('span');
            cartCountSpan.classList.add('cart-count');
            cartIcon.appendChild(cartCountSpan);
        }
        cartCountSpan.textContent = count > 0 ? count : '';
        cartCountSpan.style.display = count > 0 ? 'inline-block' : 'none';
    }

    addToCartButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const btn = event.target;
            const beatId = btn.dataset.id;
            const beatTitle = btn.dataset.title;
            const beatArtist = btn.dataset.artist;
            const beatPrice = btn.dataset.price;
            const beatCover = btn.dataset.cover;

            try {
                const response = await fetch('/carrinho/adicionar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: beatId,
                        title: beatTitle,
                        artist: beatArtist,
                        price: beatPrice,
                        cover: beatCover
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    alert(data.message);
                    updateCartCount(data.cartCount);
                } else {
                    const errorData = await response.json();
                    alert(`Erro ao adicionar ao carrinho: ${errorData.message || 'Ocorreu um erro desconhecido.'}`);
                }
            } catch (error) {
                console.error('Erro na requisição Fetch (provavelmente de conexão):', error);
                alert('Erro de conexão. Não foi possível adicionar o item ao carrinho. Verifique se o servidor está rodando.');
            }
        });
    });
});