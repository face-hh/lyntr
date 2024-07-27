<script lang="ts">
	import '../../app.css';

	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion';
</script>

<Card class="mx-auto w-full max-w-3xl">
	<CardHeader>
		<CardTitle>Lyntr Privacy Policy</CardTitle>
		<CardDescription>Effective Date: July 23, 2024</CardDescription>
	</CardHeader>
	<CardContent>
		<Accordion>
			<AccordionItem value="item-1">
				<AccordionTrigger>1. Introduction</AccordionTrigger>
				<AccordionContent>
					<p>
						Welcome to Lyntr ("we," "our," or "us"), a social media platform owned and operated by
						FaceDev. This Privacy Policy explains how we collect, use, disclose, and safeguard your
						information when you use our service.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-2">
				<AccordionTrigger>2. Information We Collect</AccordionTrigger>
				<AccordionContent>
					<p>We collect the following types of information:</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>
							<strong>User Account Information:</strong> Username, Handle, Email address, Bio (optional),
							Account creation date, Verification status
						</li>
						<li>
							<strong>Content Information:</strong> Lynts (posts) you create, Images and links you share,
							Reposts you make
						</li>
						<li>
							<strong>Interaction Data:</strong> Likes, Followers and accounts you follow, Views and
							shares of your Lynts, Notifications
						</li>
						<li>
							<strong>Usage Information:</strong> Browsing history within the platform
						</li>
						<li>
							<strong>Technical Data:</strong> Authentication tokens
						</li>
						<li>
							<strong>Other Information:</strong> IQ score that is assigned when you create your account
						</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-3">
				<AccordionTrigger>3. How We Use Your Information</AccordionTrigger>
				<AccordionContent>
					<p>We use the collected information to:</p>
					<ul class="list-disc pl-5">
						<li>Provide and maintain our service</li>
						<li>Improve user experience</li>
						<li>Enforce our policies</li>
						<li>Provide personalized content and recommendations</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-4">
				<AccordionTrigger>4. Sharing of Your Information</AccordionTrigger>
				<AccordionContent>
					<p>We may share your information:</p>
					<ul class="list-disc pl-5">
						<li>With other users as part of the social media functionality</li>
						<li>With service providers who assist in our operations</li>
						<li>When required by law or to protect our rights</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-5">
				<AccordionTrigger>5. Your Choices</AccordionTrigger>
				<AccordionContent>
					<p>You can:</p>
					<ul class="list-disc pl-5">
						<li>Update or delete your account information</li>
						<li>Delete posts you create</li>
						<li>Control your privacy settings</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-6">
				<AccordionTrigger>6. Data Security</AccordionTrigger>
				<AccordionContent>
					<p>
						We implement reasonable security measures to protect your information. However, no
						method of transmission over the Internet is 100% secure.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-7">
				<AccordionTrigger>7. Children's Privacy</AccordionTrigger>
				<AccordionContent>
					<p>
						Our service is not intended for children under 13. We do not knowingly collect
						information from children under 13.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-8">
				<AccordionTrigger>8. Changes to This Policy</AccordionTrigger>
				<AccordionContent>
					<p>We may update this policy from time to time.</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-9">
				<AccordionTrigger>9. Contact Us</AccordionTrigger>
				<AccordionContent>
					<p>
						If you have any questions about this Privacy Policy, please contact us at
						business.facedev@gmail.com
					</p>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	</CardContent>
</Card>
