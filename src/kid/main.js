import { mount } from 'svelte';
import './kid.css';
import KidApp from './KidApp.svelte';

mount(KidApp, { target: document.getElementById('app') });
