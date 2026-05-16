import '@testing-library/jest-dom/vitest';
import '../index.css';
import '../App.css';

const style = document.createElement('style');
style.innerHTML = ':root { --font-family-base: "Be Vietnam Pro", sans-serif; }';
document.head.appendChild(style);
