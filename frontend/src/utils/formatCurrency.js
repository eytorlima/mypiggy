export function formatBRL(valueInCents){
    const valueInReais = valueInCents / 100;
    
    return valueInReais.toLocaleString('pt-BR', {
       style: 'currency',
       currency: 'BRL', 
    });
}
