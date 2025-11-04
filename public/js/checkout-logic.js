document.addEventListener('DOMContentLoaded', () => {
    const finalPaymentBtn = document.getElementById('finalPaymentBtn');
    
    if (finalPaymentBtn) {
        // Armazena o texto original do botão para restaurá-lo em caso de erro
        const originalButtonText = finalPaymentBtn.innerHTML;

        finalPaymentBtn.addEventListener('click', async () => {
            finalPaymentBtn.disabled = true;
            finalPaymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i> Processando Pagamento...';

            try {
                // Chama a rota POST /finalizar-compra (que redireciona para Kiwify)
                const response = await fetch('/finalizar-compra', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const result = await response.json();

                if (response.ok && result.success && result.redirectUrl) {
                    // Redirecionamento para o gateway de pagamento (Kiwify)
                    window.location.href = result.redirectUrl;
                } else {
                    alert(result.message || 'Erro ao preparar o pagamento. Tente novamente.');
                    finalPaymentBtn.disabled = false;
                    finalPaymentBtn.innerHTML = originalButtonText;
                }

            } catch (error) {
                console.error('Erro de rede:', error);
                alert('Erro de conexão de rede. Não foi possível acessar o gateway de pagamento.');
                finalPaymentBtn.disabled = false;
                finalPaymentBtn.innerHTML = originalButtonText;
            }
        });
    }
});

