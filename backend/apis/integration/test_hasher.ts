import { CryptoHasher } from 'bun';

const key1 = new Uint8Array(32).fill(1);
const key2 = new Uint8Array(32).fill(2);
const data = 'test-data';

const h1 = new CryptoHasher('sha256', key1);
h1.update(data);
const d1 = h1.digest('hex');

const h2 = new CryptoHasher('sha256', key2);
h2.update(data);
const d2 = h2.digest('hex');

const h3 = new CryptoHasher('sha256');
h3.update(data);
const d3 = h3.digest('hex');

console.log('D1:', d1);
console.log('D2:', d2);
console.log('D3:', d3);

if (d1 === d2) {
    console.log('FAIL: Key ignored (D1 == D2)');
} else {
    console.log('SUCCESS: Key affects hash');
}

if (d1 === d3) {
    console.log('FAIL: Key ignored (D1 == D3)');
}
