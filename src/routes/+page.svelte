<script lang="ts">
	import { ModeWatcher, mode } from 'mode-watcher';
	import '../app.css';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Auth from './Auth.svelte';
	import AccountCreator from './AccountCreator.svelte';
	import { page } from '$app/stores';
	import MainPage from './MainPage.svelte';
	import Cookies from 'js-cookie';
	import { Cookie } from 'lucide-svelte';

	let authenticated: boolean = false;
	let loading: boolean = true;
	let noAccount: boolean = false;
	let userData = {
		username: '',
		handle: '',
		created_at: '',
		iq: 90,
		id: ''
	};

	async function checkAuthAndProfileStatus() {
		if (Cookies.get('temp-discord-token')) {
			authenticated = true;
		}
		if (localStorage.getItem('user-data')) {
			try {
				const data = JSON.parse(localStorage.getItem('user-data')!);
				loading = false;
				noAccount = false;
				userData = data;
				authenticated = true;
			} catch (error) {
				console.error('Failed to load user data from cache', error);
			}
		}

		try {
			const loginResponse = await fetch(`api/me`, {
				method: 'GET',
				credentials: 'include'
			});

			if (loginResponse.status === 200) {
				// User exists in the database
				const res = await loginResponse.json();
				userData = {
					username: res.username,
					handle: res.handle,
					created_at: res.created_at,
					iq: res.iq,
					id: res.id
				};

				localStorage.setItem('user-data', JSON.stringify(userData));
				// The new token is automatically set as a cookie by the server
				noAccount = false;
			} else {
				// User doesn't exist in the database
				noAccount = true;
			}
		} catch (error) {
			console.error('Error checking user status:', error);
			noAccount = true;
		}

		loading = false;
	}

	onMount(() => {
		checkAuthAndProfileStatus();
	});

	$: lyntOpened = $page.url.searchParams.get('id');
</script>

<svelte:head>
	<meta name="theme-color" content={$mode === 'dark' ? '#0C0A09' : '#F1F0E9'} />
</svelte:head>

<ModeWatcher defaultMode={'system'} />
<Toaster />

{#if loading}
	<LoadingSpinner />
{:else if !authenticated}
	<Auth />
{:else if noAccount}
	<AccountCreator />
{:else}
	<MainPage {...userData} {lyntOpened} />
{/if}
