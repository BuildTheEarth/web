import Wrapper from '@/components/layout/Wrapper'
import { Typography } from '@mantine/core'
import { NextPage } from 'next'

const Impressum: NextPage = () => {
	return (
		<Wrapper
			head={{
				title: 'Impressum (Legal Notice)',
				src: '/thumbs/9.webp',
			}}
		>
			<Typography>
				<h1>Impressum (Legal Notice)</h1>
				<p>
					<em>Information according to § 5 Digitale-Dienste-Gesetz (DDG) &amp; § 18 Abs. 2 MStV</em>
				</p>

				<h2>Information pursuant to § 5 DDG</h2>
				<p>
					BuildTheEarth is a service provided by <br />
					<strong>[-----------]</strong>
					<br />
					[-----------]
					<br />
					[00000] [-----------]
					<br />
					Germany
				</p>

				<h3>Contact Information</h3>
				<p>
					<strong>Email:</strong> <a href="mailto:administration@buildtheearth.net">administration@buildtheearth.net</a>
					<br />
					<strong>Contact Form:</strong>{' '}
					<a href="https://buildtheearth.net/contact">https://buildtheearth.net/contact</a>
					<br />
				</p>

				<h2>Responsibility for Content according to § 18 Abs. 2 MStV</h2>
				<p>
					<strong>[-----------]</strong>
					<br />
					Contact via email: administration@buildtheearth.net
				</p>

				<h2>Disclaimer</h2>
				<p>
					The contents of this online offer have been prepared carefully and according to our current knowledge, but are
					for information purposes only and do not have any legally binding effect, unless it is legally binding
					information (eg the imprint, privacy policy, terms and conditions or mandatory consumer instructions). We
					reserve the right to change or delete the contents in whole or in part, provided that contractual obligations
					remain unaffected. All offers are subject to change and non-binding. The contents of external websites to
					which we refer directly or indirectly are outside our area of responsibility and we do not adopt them as our
					own. We accept no responsibility for any content or disadvantages arising from the use of the information
					available on the linked websites. All contents presented on this website, such as texts, photographs,
					graphics, brands and trademarks are protected by the respective protective rights (copyrights, trademark
					rights). The use, reproduction, etc. are subject to our rights or the rights of the respective authors or
					rights holders. If you notice any legal violations within our Internet presence, please inform us of them. We
					will remove illegal content and links immediately after becoming aware of them.
				</p>
			</Typography>
		</Wrapper>
	)
}

export default Impressum
