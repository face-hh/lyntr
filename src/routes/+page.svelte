<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';

	import '../app.css';

	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Auth from './Auth.svelte';
	import AccountCreator from './AccountCreator.svelte';
	import { supabase } from '@/supabase';
	import { page } from '$app/stores';
	import MainPage from './MainPage.svelte';

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
		const { data, error } = await supabase.auth.getSession();
		if (data.session?.access_token) authenticated = true;
		try {
			const response = await fetch('/api/me', {
				method: 'GET',
				credentials: 'include'
			});

			if (response.status === 200) {
				const res = await response.json();
				userData = {
					username: res.username,
					handle: res.handle,
					created_at: res.created_at,
					iq: res.iq,
					id: res.id,
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

	$: lyntOpened = $page.url.searchParams.get('id');
</script>

<ModeWatcher defaultMode={'light'} />

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
