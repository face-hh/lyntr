<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';

	import '../../../app.css';

	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import LoadingSpinner from '../../LoadingSpinner.svelte';
	import Auth from '../../Auth.svelte';
	import AccountCreator from '../../AccountCreator.svelte';
	import { page } from '$app/stores';
	import MainPage from '../../MainPage.svelte';
	import Cookies from 'js-cookie';

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
		if (Cookies.get('temp-discord-token'))
			authenticated = true;
		try {
			const response = await fetch('/api/me', {
				method: 'GET',
				credentials: 'include'
			});
			console.log(response.status);
			if (response.status === 200) {
				const res = await response.json();
				userData = {
					username: res.username,
					handle: res.handle,
					created_at: res.created_at,
					iq: res.iq,
					id: res.id
				};

				noAccount = false;
			} else noAccount = true;
		} catch (error) {
			console.error('Error checking auth and profile status:', error);
			noAccount = false;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		checkAuthAndProfileStatus();
	});

	$: otherId = $page.params.handle?.replace(/^@/, '') || undefined;
</script>

<ModeWatcher defaultMode={'light'} />

<Toaster />

{#if loading}
	<LoadingSpinner />
	<!-- {:else if !authenticated}
	<Auth /> -->
{:else if noAccount}
	<AccountCreator />
{:else}
	{#key otherId}
		<MainPage {...userData} {otherId} />
	{/key}
{/if}
