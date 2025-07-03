document.addEventListener('DOMContentLoaded', () => {
    const cartTable = document.querySelector('.cart-table');
    const totalPriceElement = document.querySelector('.total-price');
    const emptyCartMessageContainer = document.querySelector('.cart-section .container');

    function updateTotal() {
        let total = 0;
        document.querySelectorAll('.cart-table tbody tr:not(.total-row)').forEach(row => {
            const subtotalText = row.querySelector('.subtotal').textContent;
            const subtotal = parseFloat(subtotalText.replace('R$', '').replace(',', '.')) || 0;
            total += subtotal;
        });

        if (totalPriceElement) {
            totalPriceElement.textContent = `R$${total.toFixed(2).replace('.', ',')}`;
        }
        checkEmptyCart();
    }

    function checkEmptyCart() {
        const productRows = document.querySelectorAll('.cart-table tbody tr:not(.total-row)');
        if (productRows.length === 0) {
            if (cartTable) cartTable.remove();
            const cartActions = document.querySelector('.cart-actions');
            if (cartActions) cartActions.remove();

            if (!document.querySelector('.empty-cart-message')) {
                const emptyMessageHtml = `
                    <p class="empty-cart-message">Seu carrinho está vazio.</p>
                    <a href="/catalogo" class="btn btn-secondary">Começar a Comprar</a>
                `;
                emptyCartMessageContainer.insertAdjacentHTML('beforeend', emptyMessageHtml);
            }
        }
    }

    if (cartTable) {
        cartTable.addEventListener('click', (event) => {
            const removeButton = event.target.closest('.btn-remove');
            if (removeButton) {
                const row = removeButton.closest('tr');
                const itemId = row.dataset.itemId;

                fetch(`/carrinho/remover/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        row.remove();
                        updateTotal();
                    } else {
                        console.error('Erro ao remover item:', response.status, response.statusText);
                        alert('Erro ao remover item do carrinho. Por favor, tente novamente.');
                    }
                })
                .catch(error => {
                    console.error('Erro na requisição de remoção:', error);
                    alert('Ocorreu um erro de rede. Por favor, tente novamente.');
                });
            }
        });
        updateTotal();
    } else {
        checkEmptyCart();
    }

    const checkoutButton = document.querySelector('.cart-actions .btn-primary');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            alert('Funcionalidade de Finalizar Compra ainda não implementada. Redirecionando para /checkout...');
            window.location.href = '/checkout';
        });
    }
});