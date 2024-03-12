import STRIPE_KEYS from './stripe-keys.js';
//console.log(STRIPE_KEYS)

const d = document,
    $pastas = d.getElementById('productos'),
    $template = d.getElementById("producto-template").content,
    $fragment = d.createDocumentFragment(),
    fetchOptions = {
        headers: {
            Authorization: `Bearer ${STRIPE_KEYS.private_key}`
        }
    }

let products,prices

//Formatación del valor
const moneyFormat = (num) => `$${num.slice(0,-2)}.${num.slice(-2)}`;

Promise.all([
    fetch('https://api.stripe.com/v1/products', fetchOptions),
    fetch('https://api.stripe.com/v1/prices', fetchOptions)

])
.then((responses) => Promise.all(responses.map((res) => res.json())))
.then(json => {

    products = json[0].data;
    prices = json[1].data;

    //console.log(products, prices)

    //Interacción HTML
    prices.forEach(el => {
        let productData = products.filter(product => product.id === el.product)
        //console.log(productData)

        $template.querySelector('.producto').setAttribute('data-price', el.id)
        $template.querySelector('img').src = productData[0].images[0]
        $template.querySelector('img').alt = productData[0].name
        $template.querySelector('figcaption').innerHTML = `
            ${productData[0].name}
            <br>
            ${moneyFormat(el.unit_amount_decimal)} ${el.currency}
        `;

        let $clone = d.importNode($template, true)
        $fragment.appendChild($clone)

    });

    $pastas.appendChild($fragment)
})
.catch(err => {
    //console.log(err)
    let message = err.statusText || 'Ocurrió un error al conectarse con la API de Stripe.'
    $pastas.innerHTML = `<p>Error ${err.status}: ${message}</p>`

})

//Usando el checkOut session 
//https://docs.stripe.com/api/checkout/sessions

d.addEventListener('click', (e) => {

    if(e.target.matches('.producto *')){
        let priceId = e.target.parentElement.getAttribute('data-price')
        //console.log(priceId)

        //Se invoca al objeto Stripe
        Stripe(STRIPE_KEYS.public_key).redirectToCheckout({
            lineItems:[{price: priceId, quantity: 1}],
            mode: 'subscription',
            successUrl: 'http://127.0.0.1:5500/views/success.html'
        })
        .then(res => {
            if(res.error){
                $pastas.insertAdjacentHTML('afterend', res.error.message)
            }
        })
    }
});