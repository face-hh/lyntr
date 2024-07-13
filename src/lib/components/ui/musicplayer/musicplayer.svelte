<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Progress } from '@/components/ui/progress';
    import { Slider } from '@/components/ui/slider';
    import { Label } from '@/components/ui/label';
    import * as Popover from '$lib/components/ui/popover/index.js';
    import { Pause, Play, Volume, Volume1, Volume2, VolumeX } from 'lucide-svelte';
    import { Button } from '@/components/ui/button';

    export let audioSrc: string;

    let audio: HTMLAudioElement;
    let progress = 0;
    let remaining = '0:00';
    let duration = 0;
    let playing = false;
    let volume = 100;
    let volumeArray = [volume];

    onMount(() => {
        audio = new Audio(audioSrc);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', () => {
            duration = audio.duration;
        });
        audio.addEventListener('ended', () => {
            playing = false;
            progress = 0;
        });
    });

    onDestroy(() => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', () => {});
            audio.removeEventListener('ended', () => {});
        }
    });
    
    function togglePlay() {
        if (playing) {
            audio.pause();
        } else {
            audio.play();
        }
        playing = !playing;
    }

    function updateProgress() {
        progress = (audio.currentTime / audio.duration) * 100;
        remaining = formatTime(audio?.currentTime || 0)
    }

    function formatTime(seconds: number) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    $: {
        if (audio) {
            audio.volume = volumeArray[0] / 100;
        }
    }
</script>

<style>
    :global(.progress-linear) {
        transition: width 0.1s linear !important;
    }
</style>

<div class="flex h-12 items-center gap-2 rounded-full bg-border p-2">
    <Button class="h-9 rounded-full" on:click={togglePlay}>
        {#if playing}
            <Pause class="h-4 w-4" />
        {:else}
            <Play class="h-4 w-4" />
        {/if}
    </Button>
    <Progress value={progress} max={100} class="h-full w-[60%] progress-linear" />
    <span class="text-sm">{remaining}</span>

    <Popover.Root portal={null}>
        <Popover.Trigger asChild let:builder>
            <Button class="h-9 rounded-full" builders={[builder]}>
                {#if volumeArray[0] <= 0}
                    <VolumeX class="h-4 w-4" />
                {:else if volumeArray[0] <= 33.4}
                    <Volume class="h-4 w-4" />
                {:else if volumeArray[0] <= 66.7}
                    <Volume1 class="h-4 w-4" />
                {:else if volumeArray[0] <= 100}
                    <Volume2 class="h-4 w-4" />
                {/if}
            </Button>
        </Popover.Trigger>
        <Popover.Content class="w-60">
            <div class="flex justify-center gap-2 items-center">
                <Label for="width">{volumeArray[0]}%</Label>
                <Slider bind:value={volumeArray} max={100} step={1} />
            </div>
        </Popover.Content>
    </Popover.Root>
</div>