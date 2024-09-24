<script lang="ts">
	import * as AlertDialog from '@/components/ui/alert-dialog';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Separator } from '@/components/ui/separator';
	import { Label } from '@/components/ui/label';

	import IQTest from './IQTest.svelte';
	import { toast } from 'svelte-sonner';
	import { PUBLIC_DISCORD_CLIENT_ID } from '$env/static/public';

	let loading = false;
	let nickname = '';
	let username = '';
	let iqReport: string | null;
	let totalIQ: number | null;

	async function authLogin() {
		const callbackUrl = new URL(window.location.href);
		callbackUrl.search = '';
		callbackUrl.pathname = '/api/callback';

		window.location.href = `https://discord.com/oauth2/authorize?client_id=${PUBLIC_DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl.toString())}&scope=identify+email`;
	}

	let allQuestionsCompleted = localStorage.getItem('current_question') === '20' ? true : false;

	const handleQuestionsCompleted = (event: { detail: boolean }) => {
		allQuestionsCompleted = event.detail;
	};

	const handleSubmit = async () => {
		const questions = JSON.parse(localStorage.getItem('iq_questions') || '[]');
		let obj: Record<string, string> = {};

		for (const question of questions) {
			if (question?.id) {
				obj[question.id] = localStorage.getItem(question.id) || '';
			}
		}

		try {
			const response = await fetch('/api/profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					username: nickname,
					handle: username,
					...obj
				})
			});

			if (response.status !== 201) {
				throw new Error('Non-201 status code');
			}

			const res = await response.json();

			iqReport = res.formattedText;
			totalIQ = res.totalIQ;
		} catch (error) {
			toast(
				'Something went wrong. This can include: your @handle being already taken; your @handle not being alphabetic ("-" is allowed); the server having an issue. Please try again later.'
			);
		}
	};
</script>

<div class="flex min-h-dvh items-center justify-center">
	<div class="flex flex-col gap-6 p-1 md:flex-row">
		<div class="flex flex-col items-center gap-2">
			<div class="inline-flex items-center gap-2">
				<img
					src="/logo.svg"
					alt="Lyntr"
					class="pointer-events-none h-32 w-32 select-none md:h-40 md:w-40"
				/>
				<Label class="select-none text-8xl">Lyntr.</Label>
			</div>

			<p class="text-3xl">Welcome onboard!</p>
			<p class="text-3xl">Let's get you started.</p>

			<div class="flex w-full flex-col gap-5">
				<div class="flex flex-col gap-1.5">
					<Label for="email-2" placeholder="Nickname...">Nickname</Label>
					<Input
						type="email"
						id="email-2"
						placeholder="FaceDev"
						class="border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
						bind:value={nickname}
					/>
					<p class="text-sm text-muted-foreground">Enter your desired nickname (max. 60 char.)</p>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="username">Username</Label>
					<Input
						type="text"
						id="username"
						placeholder="@facedev"
						class="border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
						bind:value={username}
						on:input={() => {
							username = '@' + username.replace(/[^0-9a-z_-]/gi, '').toLowerCase();
						}}
					/>
					<p class="text-sm text-muted-foreground">Enter your permanent username (max. 32 char.)</p>
					<p class="text-xs text-muted-foreground">
						Only alphabetical lowercase letters (a-z) work, including '-'.
					</p>
				</div>

				{#if allQuestionsCompleted}
					<AlertDialog.Root>
						<AlertDialog.Trigger asChild let:builder>
							<Button
								builders={[builder]}
								on:click={handleSubmit}
								disabled={!nickname || !username}
							>
								Continue
							</Button>
						</AlertDialog.Trigger>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title class="mb-2 text-2xl font-bold"
									>Welcome to Lyntr!</AlertDialog.Title
								>
								<AlertDialog.Description>
									<div class="space-y-4">
										<p>
											Make sure to read the <a href="tos">Terms of Service</a> and
											<a href="privacy">Privacy Policy</a>.
										</p>
										{#if iqReport}
											<div>
												<h3 class="mb-2 font-semibold">IQ Report:</h3>
												<pre class="whitespace-pre-wrap text-sm">{iqReport}</pre>
											</div>
											<p class="text-right font-semibold">Total IQ: {totalIQ}</p>
										{/if}
									</div>
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Action on:click={() => location.reload()}>Continue</AlertDialog.Action>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>
				{/if}
			</div>
			<span class="mt-4 text-left text-sm"
				>Already have an account on Lyntr? <button
					class="font-bold text-primary"
					on:click={authLogin}>Log in</button
				></span
			>
		</div>
		<Separator class="h-[1px] w-full md:h-full md:w-[1px]" />
		<div class="w-full rounded-md border-2 border-primary p-4 md:min-w-[400px] md:max-w-[400px]">
			<IQTest on:questionsCompleted={handleQuestionsCompleted} />
		</div>
	</div>
</div>
