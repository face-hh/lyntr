<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '@/supabase';
	import type { AuthSession } from '@supabase/supabase-js';
	import MainPage from './MainPage.svelte';
	import Auth from './Auth.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import AccountCreator from './AccountCreator.svelte';

	let session: AuthSession | null = null;
	let loading: boolean = true;
    let noAccount = false;

	onMount(() => {
		supabase.auth.getSession().then(async ({ data }) => {
			session = data.session;

			const response = await fetch('/api/profile?id=' + session?.user.id);

			if (response.status == 404) {
				noAccount = true;
			}

			loading = false;
		});

		supabase.auth.onAuthStateChange((_event, _session) => {
			session = _session;
		});
	});
</script>

<div>
	{#if loading}
		<LoadingSpinner />
    <!-- {:else if noAccount}
        <AccountCreator /> -->
	{:else if !session}
		<Auth />
	{:else}
		<MainPage {session} />
	{/if}
</div>
