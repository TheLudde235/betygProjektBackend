<script lang="ts">
import { HTTPClient } from "../services/httpclient.service";

const httpClient = new HTTPClient('include');

const jsonPromise = httpClient.get('/');

function hover($event: MouseEvent) {  
    if ($event.target instanceof HTMLElement) 
        $event.target.style.backgroundColor = `rgb(${Math.random() * 210}, ${Math.random() * 210}, ${Math.random() * 210})`;
}

</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

{#await jsonPromise}
    <p>Loading...</p>
{:then json} 
    <p on:mouseenter={hover}>{JSON.stringify(json)}</p>
{/await}

<div on:mouseenter={hover}>DIV</div>


<style>
    * {
        background-color: var(--bg-color);
    }
</style>