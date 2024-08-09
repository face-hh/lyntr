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
		<CardTitle>Lyntr Terms of Service</CardTitle>
		<CardDescription>Effective Date: July 23, 2024</CardDescription>
	</CardHeader>
	<CardContent>
		<Accordion>
			<AccordionItem value="item-1">
				<AccordionTrigger>1. Acceptance of Terms</AccordionTrigger>
				<AccordionContent>
					<p>
						By accessing or using Lyntr, you agree to be bound by these Terms of Service and all
						applicable laws and regulations. If you do not agree with any part of these terms, you
						may not use our service.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-2">
				<AccordionTrigger>2. Description of Service</AccordionTrigger>
				<AccordionContent>
					<p>
						Lyntr is a social media platform that allows users to create, share, and interact with
						short-form content called "Lynts". Our service includes features such as following other
						users, liking and sharing content, and receiving notifications.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-3">
				<AccordionTrigger>3. User Accounts</AccordionTrigger>
				<AccordionContent>
					<ul class="list-disc space-y-2 pl-5">
						<li>You must be at least 13 years old to use Lyntr.</li>
						<li>
							You are responsible for maintaining the confidentiality of your account the email and
							token associated with it.
						</li>
						<li>You may not use another user's account without permission.</li>
						<li>You are solely responsible for any activity that occurs under your account.</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-4">
				<AccordionTrigger>4. User Content</AccordionTrigger>
				<AccordionContent>
					<ul class="list-disc space-y-2 pl-5">
						<li>You retain ownership of any content you post on Lyntr.</li>
						<li>
							By posting content, you grant Lyntr a worldwide, non-exclusive, royalty-free license
							to use, reproduce, modify, and distribute your content.
						</li>
						<li>You are solely responsible for your content and the consequences of posting it.</li>
						<li>
							You agree not to post content that is illegal, abusive, harassing, or violates the
							rights of others.
						</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-5">
				<AccordionTrigger>5. Prohibited Activities</AccordionTrigger>
				<AccordionContent>
					<p>You agree not to engage in any of the following activities:</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Violating any laws or regulations</li>
						<li>
							Impersonating other users or entities; doing so may result in a reset of your handle,
							or in a ban if the person or entity you are impersonating contacts us.
						</li>
						<li>Interfering with or disrupting the service</li>
						<li>Collecting user information without consent</li>
						<li>Posting spam or engaging in abusive behavior</li>
						<li>Using the service for any unauthorized commercial purposes</li>
						<li>Posting or sharing any NSFW (Not Safe For Work) content</li>
					</ul>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-6">
				<AccordionTrigger>6. Intellectual Property</AccordionTrigger>
				<AccordionContent>
					<p>
						The Lyntr service, including its original content, features, and functionality, is
						created and operated by FaceDev. While we haven't registered formal intellectual
						property rights, we kindly ask users to respect our work. Users agree not to copy,
						modify, or distribute any part of the service without explicit permission from FaceDev.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-7">
				<AccordionTrigger>7. Use of Lyntr Name in Projects</AccordionTrigger>
				<AccordionContent>
					<p>
						If you use the Lyntr name in any extensions, projects, or related materials, you must
						<strong>clearly and prominently disclose</strong> that you are not affiliated with FaceDev
						or Lyntr. This disclosure should be visible and unambiguous to avoid any confusion.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-8">
				<AccordionTrigger>8. Termination</AccordionTrigger>
				<AccordionContent>
					<p>
						We may terminate or suspend your account and access to the service immediately, without
						prior notice or liability, for any reason, including breach of these Terms. Upon
						termination, your right to use the service will immediately cease.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-9">
				<AccordionTrigger>9. Disclaimer of Warranties</AccordionTrigger>
				<AccordionContent>
					<p>
						Lyntr is provided "as is" and "as available" without any warranties of any kind, either
						express or implied. We do not guarantee that the service will be uninterrupted, secure,
						or error-free.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-10">
				<AccordionTrigger>10. Limitation of Liability</AccordionTrigger>
				<AccordionContent>
					<p>
						In no event shall FaceDev, its directors, employees, partners, agents, suppliers, or
						affiliates be liable for any indirect, incidental, special, consequential, or punitive
						damages, including loss of profits, data, or other intangible losses, resulting from
						your access to or use of (or inability to access or use) the service.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-11">
				<AccordionTrigger>11. Changes to Terms</AccordionTrigger>
				<AccordionContent>
					<p>
						We reserve the right to modify or replace these Terms at any time. If a revision is
						material, we will provide at least 30 days' notice prior to any new terms taking effect.
						What constitutes a material change will be determined at our sole discretion.
					</p>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="item-12">
				<AccordionTrigger>12. Contact Us</AccordionTrigger>
				<AccordionContent>
					<p>
						If you have any questions about these Terms, please contact us at
						business.facedev@gmail.com
					</p>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	</CardContent>
</Card>
