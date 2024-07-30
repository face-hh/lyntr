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
	import { cdnUrl } from './stores';
	
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
		const { data } = await supabase.auth.getSession();
		if (data.session?.access_token) {
			authenticated = true;
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (user?.email) {
				try {
					const loginResponse = await fetch(`api/login?email=${encodeURIComponent(user.email)}`, {
						method: 'GET',
						credentials: 'include',
						headers: {
							Authorization: `Bearer ${data.session.access_token}`
						}
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
			} else {
				console.error('No email found for authenticated user');
				noAccount = true;
			}
		} else {
			authenticated = false;
		}
		loading = false;
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
