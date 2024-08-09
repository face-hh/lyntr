<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { onMount } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import LoadingSpinner from './LoadingSpinner.svelte';
	import Auth from './Auth.svelte';
	import AccountCreator from './AccountCreator.svelte';
	import { page } from '$app/stores';
	import MainPage from './MainPage.svelte';
	import Cookies from 'js-cookie';
	import type { FeedItem } from './stores';

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

	let selectedLynt: FeedItem | null;

	async function getLynt(lyntOpened: string) {
		const response = await fetch('api/lynt?id=' + lyntOpened, { method: 'GET' });

		const res = await response.json();

		return res as FeedItem;
	}
	function getStats() {
		if (!selectedLynt) return '💬 0   🔁 0   ❤️ 0   👁️ 0';

		return `💬 ${selectedLynt.commentCount.toLocaleString()}   🔁 ${selectedLynt.repostCount.toLocaleString()}   ❤️ ${selectedLynt.likeCount.toLocaleString()}   👁️ ${selectedLynt.views.toLocaleString()}`;
	}

	onMount(async () => {
		if(lyntOpened) selectedLynt = await getLynt(lyntOpened);
	});
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

<svelte:head>
	{#if selectedLynt}
		<meta
			property="og:title"
			content="{selectedLynt.username} (@{selectedLynt.handle}) on Lyntr with {selectedLynt.iq} IQ"
		/>
		<meta property="og:site_name" content={getStats()} />

		<meta content="#eae7db" data-react-helmet="true" name="theme-color" />
		<meta name="twitter:card" content="summary_large_image" />

		<meta property="og:type" content="website" />
		{#if selectedLynt.has_image}
			<meta property="og:image" content="https://cdn.lyntr.com/lyntr/{selectedLynt.id}.webp" />
		{/if}
		<meta property="og:url" content="https://lyntr.com/?id={selectedLynt.id}" />

		{#if selectedLynt.parentUserHandle === null}
			<meta property="og:description" content={selectedLynt.content} />
		{:else}
			<meta
				property="og:description"
				content="{selectedLynt.content}\nQuoting {selectedLynt.parentUserUsername} (@{selectedLynt.parentUserHandle}) with {selectedLynt.parentUserIq} IQ\n{selectedLynt.parentContent}"
			/>
		{/if}

		<meta name="description" content="Lyntr is a micro-blogging social media with an IQ test." />
	{/if}
</svelte:head>
