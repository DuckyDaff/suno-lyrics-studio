import { mount } from 'svelte';
import './styles/tokens.css';
import './styles/base.css';
import App from './App.svelte';
import KidApp from './kid/KidApp.svelte';

const isKid = /^\/gala\b/.test(location.pathname);
mount(isKid ? KidApp : App, { target: document.getElementById('app') });
