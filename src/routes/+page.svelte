<script lang="ts">
	import { onMount } from 'svelte';
	import MainPage from './MainPage.svelte';
	import Auth from './Auth.svelte';
	import { Toaster } from '$lib/components/ui/sonner';

	import LoadingSpinner from './LoadingSpinner.svelte';
	import AccountCreator from './AccountCreator.svelte';
	import { supabase } from '@/supabase';

	let authenticated: boolean = false;
	let loading: boolean = true;
	let noAccount: boolean = false;

	let username = '';
	let handle = '';
	let created_at = '';
	let iq = 90;
	let profile_picture = '';

	async function checkAuthAndProfileStatus() {
		const { data, error } = await supabase.auth.getSession();

		if (data.session?.access_token) authenticated = true;

		try {
			const response = await fetch('/api/me', {
				method: 'GET',
				credentials: 'include'
			});
			console.log(response.status);
			if (response.status === 200) {
				const res = await response.json();

				username = res.username;
				handle = res.handle;
				created_at = res.created_at;
				iq = res.iq;
				profile_picture = res.profile_picture;

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
</script>

<Toaster />

{#if loading}
	<LoadingSpinner />
{:else if !authenticated}
	<Auth />
{:else if noAccount}
	<AccountCreator />
{:else}
	<MainPage {username} {handle} {iq} {created_at} {profile_picture} />
{/if}
