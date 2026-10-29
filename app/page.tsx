import {
	ArrowRightIcon,
	ArrowUpRightIcon,
	DiamondIcon,
	LandmarkIcon,
	LockIcon,
	MailIcon,
	MapPinIcon,
	ShieldCheckIcon,
} from "lucide-react";
import { cacheLife } from "next/cache";
import Image from "next/image";
import { Brand } from "@/components/site/brand";
import { Catalogue } from "@/components/site/catalogue";
import { ContactForm } from "@/components/site/contact-form";
import { Header } from "@/components/site/header";
import { PhoneButton } from "@/components/site/phone-button";
import { SectionHeading } from "@/components/site/section-heading";
import {
	ScrollButton,
	Section,
	SiteProvider,
} from "@/components/site/site-context";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { events, team } from "@/lib/site-data";

const noise =
	"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.24'/%3E%3C/svg%3E\")";

const trust = [
	{ label: "Indywidualna wycena", icon: ShieldCheckIcon },
	{ label: "Profesjonalny skup", icon: LandmarkIcon },
	{ label: "Dyskretna obsługa", icon: LockIcon },
];

const steps = [
	{
		title: "Sprawdź kategorię",
		text: "Zobacz, jakie rodzaje przedmiotów skupuje nasz lombard. Nie widzisz swojej rzeczy? Zapytaj pracownika.",
	},
	{
		title: "Skontaktuj się",
		text: "Prześlij nam informacje o swoim przedmiocie. Nasi pracownicy zapoznają się z Twoją ofertą.",
	},
	{
		title: "Poznaj wycenę",
		text: "Pracownik oceni przedmiot i indywidualnie przedstawi propozycję. Decyzja o sprzedaży należy do Ciebie.",
	},
];

const faq = [
	{
		q: "Jak mogę poznać wycenę mojego przedmiotu?",
		a: "Przedstaw nam swój przedmiot, a pracownik przygotuje indywidualną propozycję po jego ocenie.",
	},
	{
		q: "Czy każdy przedmiot z danej kategorii zostanie przyjęty?",
		a: "Nie zawsze. Możliwość skupu zależy od rodzaju, stanu oraz decyzji pracownika lombardu.",
	},
	{
		q: "Czy mogę zapytać o nietypowy przedmiot?",
		a: "Oczywiście. Opisz nietypowy przedmiot i prześlij nam zapytanie. Poinformujemy Cię, czy możemy go przyjąć.",
	},
];

const footerLink = "h-auto p-0 text-[11px] font-normal text-[#b0a19b]";

async function getVisibleEvents() {
	"use cache";
	cacheLife("hours");
	const today = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Europe/Warsaw",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date());
	return events.filter(
		(e) => e.visible && (!e.expires || today <= e.expires),
	);
}

export default async function Home() {
	const visibleEvents = await getVisibleEvents();
	const showEvents = visibleEvents.length > 0;

	return (
		<SiteProvider>
			<div className="theme-site bg-background font-sans leading-[1.58] text-foreground selection:bg-primary selection:text-primary-foreground">
				<div className="min-h-7.75 bg-[#231318] px-4.5 py-1.75 text-center text-[10px] tracking-[.16em] text-[#d6b9ac] uppercase max-phone:text-[9px] max-phone:leading-normal">
					SINCLAIR &amp; CO.{" "}
					<DiamondIcon className="inline size-2 fill-current align-middle text-gold-pale" />{" "}
					LOS SANTOS{" "}
					<DiamondIcon className="inline size-2 fill-current align-middle text-gold-pale" />{" "}
					WYCENA WYŁĄCZNIE INDYWIDUALNA
				</div>
				<Header showEvents={showEvents} />
				<main>
					<section
						aria-labelledby="hero-title"
						className="relative min-h-180 overflow-hidden max-tablet:min-h-0"
						style={{
							background:
								"radial-gradient(ellipse 60% 70% at 78% 47%, rgba(87,26,39,.4), transparent 75%), linear-gradient(150deg, #1b1115 0%, #0d090b 53%, #080708 100%)",
						}}
					>
						<div
							className="pointer-events-none absolute inset-0 opacity-[.18]"
							style={{ backgroundImage: noise }}
						/>
						<div className="mx-auto max-w-295 px-7 max-phone:px-5 relative grid min-h-180 grid-cols-[1fr_1.05fr] items-center gap-5 max-laptop:grid-cols-[1.1fr_.9fr] max-tablet:min-h-0 max-tablet:grid-cols-1">
							<div className="z-2 pt-17.5 pb-22.5 max-tablet:pt-21.75 max-tablet:pb-5 max-phone:pt-16.5 max-phone:pb-5.5">
								<div className="text-[11px] font-bold tracking-[.22em] text-gold uppercase flex items-center gap-3 before:h-px before:w-8.75 before:bg-gold">
									LOMBARD · LOS SANTOS
								</div>
								<h1
									className="my-6 font-serif text-[clamp(67px,8.2vw,122px)] leading-[.87] font-medium tracking-[-.045em] max-phone:text-[69px]"
									id="hero-title"
								>
									SINCLAIR{" "}
									<em className="mt-3.25 block text-[.53em] tracking-[.13em] text-gold-pale not-italic">
										&amp; CO.
									</em>
								</h1>
								<Separator className="my-6 bg-gold data-horizontal:w-11" />
								<p className="mt-6.75 mb-4.75 max-w-125 font-serif text-[31px] leading-[1.16] max-phone:text-[27px]">
									Nie wszystko, co cenne, ma swoją cenę na
									etykiecie.
								</p>
								<p className="mb-9.25 max-w-112.5 text-sm text-[#bbafae]">
									Wyjątkowe przedmioty. Dyskretna obsługa.
									Indywidualne podejście do każdej transakcji.
									Odkryj, co możesz sprzedać w Sinclair &amp;
									CO.
								</p>
								<div className="flex flex-wrap items-center gap-3.25 max-phone:items-stretch">
									<ScrollButton
										to="catalogue"
										size="cta"
										className="border-[#873544] hover:bg-[#8a2b3d] max-phone:w-full"
									>
										Co skupujemy{" "}
										<ArrowUpRightIcon className="size-4" />
									</ScrollButton>
									<ScrollButton
										to="contact"
										size="cta"
										variant="outline"
										className="border-[#76605b] bg-black/10 text-gold-pale hover:border-gold hover:bg-gold/10 hover:text-gold-pale max-phone:w-full dark:border-[#76605b] dark:bg-black/10 dark:hover:bg-gold/10"
									>
										Zapytaj o wizytę{" "}
										<ArrowRightIcon className="size-4" />
									</ScrollButton>
								</div>
							</div>
							<div
								aria-hidden="true"
								className="relative flex h-147.5 items-center justify-center max-tablet:h-83.75 max-phone:h-62.5"
							>
								<div
									className="absolute aspect-square w-[min(47vw,555px)] rounded-full border border-[rgba(192,155,113,.19)] max-laptop:w-[42vw] max-tablet:w-78.75 max-phone:w-62.5"
									style={{
										boxShadow:
											"0 0 0 34px rgba(138,96,89,.025), 0 0 0 85px rgba(138,96,89,.025), inset 0 0 100px rgba(109,28,40,.22)",
									}}
								>
									<div className="absolute inset-[12%] rounded-full border border-dashed border-[rgba(197,167,121,.11)]" />
									<div className="absolute inset-[25%] rounded-full border border-[rgba(197,167,121,.11)] opacity-80" />
								</div>
								<div className="relative z-2 flex aspect-square w-[min(38vw,430px)] items-center justify-center max-laptop:w-[36vw] max-tablet:w-70 max-phone:w-55">
									<Image
										alt=""
										className="h-auto w-full object-contain drop-shadow-[0_35px_40px_rgba(0,0,0,.8)]"
										src="/assets/logo.png"
										width={430}
										height={448}
										priority
									/>
								</div>
								<div className="absolute right-[7%] bottom-6.25 border-t border-[rgba(197,167,121,.45)] pt-3 font-serif text-[21px] leading-[normal] tracking-[.04em] text-gold italic max-tablet:bottom-2.75 max-phone:right-[2%] max-phone:bottom-0 max-phone:text-base">
									Dyskrecja. Klasa. Zaufanie.
								</div>
							</div>
							<div className="absolute bottom-4 left-0 origin-top-left -rotate-90 text-[10px] tracking-[.26em] text-[rgba(197,167,121,.48)]">
								ODKRYJ WARTOŚĆ SWOICH PRZEDMIOTÓW
							</div>
						</div>
					</section>

					<div className="border-y border-border bg-[#120e10]">
						<div className="mx-auto max-w-295 px-7 max-phone:px-5 grid grid-cols-3 max-tablet:grid-cols-1">
							{trust.map((t) => (
								<div
									key={t.label}
									className="flex min-h-21.25 items-center justify-center gap-3.25 text-[11px] font-bold tracking-[.12em] text-[#d2c0b8] uppercase not-last:border-r not-last:border-border max-tablet:min-h-15.75 max-tablet:justify-start max-tablet:pl-5 max-tablet:not-last:border-r-0 max-tablet:not-last:border-b"
								>
									<t.icon
										className="size-5.75 text-gold"
										strokeWidth={1.3}
									/>
									{t.label}
								</div>
							))}
						</div>
					</div>

					<Section
						aria-labelledby="catalogue-title"
						className="py-28 max-laptop:py-22 max-phone:py-19.5 bg-linear-to-b/srgb from-background to-[#130d10]"
						id="catalogue"
					>
						<div className="mx-auto max-w-295 px-7 max-phone:px-5">
							<SectionHeading
								label="NASZA OFERTA"
								title="Co skupujemy?"
								id="catalogue-title"
							>
								Poznaj przedmioty, które przyjmujemy do skupu.
								Każdą ofertę rozpatrujemy indywidualnie.
							</SectionHeading>
							<Catalogue />
							<p className="mt-6.75 mb-3 border-l-2 border-gold py-2.5 pl-4 text-xs text-[#b0a1a0]">
								Wartość każdego przedmiotu ustalamy
								indywidualnie, po zapoznaniu się z jego stanem i
								pochodzeniem.
							</p>
						</div>
					</Section>

					{showEvents && (
						<Section
							aria-labelledby="promo-title"
							className="py-28 max-laptop:py-22 max-phone:py-19.5 relative isolate overflow-hidden border-y border-[rgba(197,167,121,.18)]"
							id="events"
							style={{
								background:
									"radial-gradient(ellipse 65% 80% at 24% 44%, rgba(118,23,35,.33), transparent 70%), linear-gradient(115deg, #110b0e, #1e1015 64%, #0d0a0c)",
							}}
						>
							<div
								className="absolute -right-65 -bottom-75 -z-1 size-155 rounded-full border border-[rgba(206,157,132,.13)]"
								style={{
									boxShadow:
										"0 0 0 60px rgba(197,167,121,.019), 0 0 0 120px rgba(197,167,121,.018)",
								}}
							/>
							<div className="mx-auto max-w-295 px-7 max-phone:px-5">
								<SectionHeading
									label="AKTUALNE WYDARZENIE"
									title={
										visibleEvents.length === 1
											? visibleEvents[0].title
											: "Wydarzenia i promocje"
									}
									id="promo-title"
								>
									Wyjątkowa oferta przygotowana dla klientów
									Sinclair &amp; CO. Sprawdź, jakie przedmioty
									obejmuje promocja.
								</SectionHeading>
								<div className="mx-auto grid max-w-262.5 grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-8">
									{visibleEvents.map((ev) => (
										<article
											key={ev.id}
											className="mx-auto w-full max-w-140 text-center"
										>
											{ev.image && (
												<Image
													alt={ev.title}
													className="h-auto w-full rounded-[10px] border border-[rgba(197,167,121,.28)] shadow-[0_30px_70px_rgba(0,0,0,.45)]"
													src={ev.image}
													width={560}
													height={700}
												/>
											)}
											<h3 className="mt-4.5 mb-0.75 font-serif text-[32px] leading-[normal] font-medium text-gold-pale">
												{ev.title}
											</h3>
											{ev.dates && (
												<p className="mb-3 text-xs tracking-[.13em] text-gold">
													{ev.dates}
												</p>
											)}
											{ev.description && (
												<p className="text-[13px] leading-[1.8] text-[#c6b9b5]">
													{ev.description}
												</p>
											)}
										</article>
									))}
								</div>
							</div>
						</Section>
					)}

					<Section
						className="py-28 max-laptop:py-22 max-phone:py-19.5 bg-[#0f0b0d]"
						id="how-it-works"
					>
						<div className="mx-auto max-w-295 px-7 max-phone:px-5">
							<SectionHeading
								label="PROSTA DROGA DO TRANSAKCJI"
								title="Jak działamy?"
							>
								Każdą transakcję przeprowadzamy dyskretnie, z
								dbałością o szczegóły i szacunkiem do klienta.
							</SectionHeading>
							<div className="grid grid-cols-3 gap-8 max-tablet:grid-cols-1 max-tablet:gap-0">
								{steps.map((step, i) => (
									<div
										key={step.title}
										className="border-t border-border py-7.25"
									>
										<div className="font-serif text-[57px] leading-none font-medium text-[#785b4d]">
											0{i + 1}.
										</div>
										<h3 className="mt-5.5 mb-2.5 font-serif text-[33px] leading-[1.05] font-medium">
											{step.title}
										</h3>
										<p className="mb-[1em] max-w-77.5 text-[13px] text-muted-foreground">
											{step.text}
										</p>
									</div>
								))}
							</div>
						</div>
					</Section>

					<Section
						className="py-28 max-laptop:py-22 max-phone:py-19.5 border-y border-border bg-linear-125/srgb from-[#1a1015] to-[#100c0e]"
						id="about"
					>
						<div className="mx-auto max-w-295 px-7 max-phone:px-5 grid grid-cols-[.9fr_1.1fr] items-center gap-[10%] max-tablet:grid-cols-1">
							<div
								aria-hidden="true"
								className="relative flex aspect-square items-center justify-center max-tablet:hidden"
							>
								<div className="absolute inset-[12%] rotate-45 border border-[rgba(197,167,121,.33)]" />
								<div className="absolute inset-0 rounded-full border border-[rgba(197,167,121,.1)]" />
								<Image
									alt=""
									className="relative h-auto w-full max-w-75 object-contain opacity-[.98] drop-shadow-[0_30px_45px_rgba(0,0,0,.55)]"
									src="/assets/logo.png"
									width={300}
									height={312}
								/>
							</div>
							<div>
								<div className="text-[11px] font-bold tracking-[.22em] text-gold uppercase">
									NASZA FILOZOFIA
								</div>
								<h2 className="mt-3.75 mb-6.25 font-serif text-[clamp(48px,5vw,72px)] leading-[.97] font-medium">
									Więcej niż zwykły lombard.
								</h2>
								<p className="mb-[1em] max-w-125 text-[13px] text-[#c3b1b0]">
									Sinclair &amp; CO. to miejsce, w którym
									liczy się dyskrecja, uważność i szacunek do
									wartości posiadanych przedmiotów. Nie każde
									znalezisko jest takie samo — dlatego każdą
									ofertę rozpatrujemy osobno.
								</p>
								<p className="mb-[1em] max-w-125 text-[13px] text-[#c3b1b0]">
									Budujemy relacje oparte na zaufaniu. Bez
									publicznego cennika, bez obietnic składanych
									w ciemno i bez presji. O szczegółach
									rozmawiamy z Tobą osobiście.
								</p>
								<div className="mt-7.5 font-serif text-[30px] leading-[normal] text-gold italic">
									Sinclair &amp; CO.
								</div>
							</div>
						</div>
					</Section>

					<Section
						aria-labelledby="team-title"
						className="py-28 max-laptop:py-22 max-phone:py-19.5 border-t border-border"
						id="team"
						style={{
							background:
								"radial-gradient(ellipse 55% 65% at 50% 15%, rgba(86,24,37,.2), transparent 80%), #100b0e",
						}}
					>
						<div className="mx-auto max-w-295 px-7 max-phone:px-5">
							<SectionHeading
								label="OSOBY, KTÓRE TWORZĄ SINCLAIR & CO."
								title="Nasz zespół."
								id="team-title"
							>
								Nasz zespół służy pomocą w sprawie skupu i
								indywidualnych wycen.
							</SectionHeading>
							<div className="grid grid-cols-3 gap-5.5 max-laptop:grid-cols-2 max-[620px]:grid-cols-1">
								{team.map((person) => (
									<Card
										key={person.name}
										className="min-w-0 gap-0 border border-border bg-muted py-0 text-base leading-[1.58] ring-0"
									>
										<div
											className="relative grid h-73.75 place-items-center overflow-hidden border-b border-[rgba(197,167,121,.3)] after:pointer-events-none after:absolute after:inset-0 after:bg-linear-to-t/srgb after:from-[rgba(10,7,9,.3)] after:to-transparent after:to-33% max-[620px]:h-72.5"
											style={{
												background:
													"radial-gradient(circle at 50% 25%, #4a2833, #181016 70%)",
											}}
										>
											<Image
												alt={`Zdjęcie: ${person.name}`}
												className="size-full object-cover object-[center_34%]"
												src={person.image}
												width={400}
												height={400}
											/>
										</div>
										<CardContent className="flex flex-1 flex-col px-6 pt-6 pb-6.5">
											<div className="min-h-4 text-[10px] tracking-[.14em] text-gold uppercase">
												{person.role}
											</div>
											<CardTitle className="mt-2.75 mb-3 font-serif text-4xl leading-[1.05]">
												{person.name}
											</CardTitle>
											<p className="mb-3 flex-1 text-xs leading-[1.8] text-[#c4b3ad]">
												{person.desc}
											</p>
											<PhoneButton phone={person.phone} />
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					</Section>

					<Section
						className="py-28 max-laptop:py-22 max-phone:py-19.5"
						id="contact"
						style={{
							background:
								"radial-gradient(ellipse at 85% 70%, rgba(101,34,48,.14), transparent 45%), #0d090b",
						}}
					>
						<div className="mx-auto max-w-295 px-7 max-phone:px-5">
							<div className="grid grid-cols-[.88fr_1.12fr] items-start gap-16.25 max-laptop:gap-7.5 max-tablet:grid-cols-1">
								<div>
									<div className="text-[11px] font-bold tracking-[.22em] text-gold uppercase">
										BĄDŹMY W KONTAKCIE
									</div>
									<h2 className="mt-4.5 mb-6.25 font-serif text-[clamp(50px,5.5vw,76px)] leading-[.94] font-medium max-phone:text-[60px]">
										Masz coś wyjątkowego?
									</h2>
									<p className="mb-7.75 max-w-97.5 text-[13px] text-[#b6a7a5]">
										Masz przedmiot, który chcesz sprzedać?
										Opisz go i prześlij zapytanie. Nasi
										pracownicy zapoznają się z ofertą i
										skontaktują się z Tobą.
									</p>
									<div className="flex items-start gap-3.25 border-t border-border py-5 text-[13px] text-[#c9bcb6]">
										<MapPinIcon
											className="size-5.5 shrink-0 text-gold"
											strokeWidth={1.4}
										/>
										<div>
											<strong className="text-gold-pale">
												Los Santos
											</strong>
											<br />
											<span className="text-muted-foreground">
												Hawick Avenue, Los Santos
											</span>
										</div>
									</div>
									<div className="flex items-start gap-3.25 border-t border-border py-5 text-[13px] text-[#c9bcb6]">
										<MailIcon
											className="size-5.5 shrink-0 text-gold"
											strokeWidth={1.4}
										/>
										<div>
											<strong className="text-gold-pale">
												Indywidualna obsługa
											</strong>
											<br />
											<span className="text-muted-foreground">
												Każdą ofertę rozpatrujemy
												indywidualnie i z zachowaniem
												dyskrecji.
											</span>
										</div>
									</div>
								</div>
								<ContactForm />
							</div>
							<div className="mt-15">
								<h3 className="mb-[1em] font-serif text-[35px] leading-[normal] font-medium">
									Najczęstsze pytania
								</h3>
								<Accordion>
									{faq.map((item) => (
										<AccordionItem
											key={item.q}
											value={item.q}
											className="border-t py-4.25 not-last:border-b-0 last:border-b"
										>
											<AccordionTrigger className="border-0 py-0 text-[13px] font-semibold text-[#dfc9bc] hover:no-underline **:data-[slot=accordion-trigger-icon]:text-gold cursor-pointer">
												{item.q}
											</AccordionTrigger>
											<AccordionContent className="pb-0">
												<p className="mt-3.25 mb-0.75 max-w-187.5 text-xs text-muted-foreground">
													{item.a}
												</p>
											</AccordionContent>
										</AccordionItem>
									))}
								</Accordion>
							</div>
						</div>
					</Section>
				</main>

				<footer className="border-t border-border bg-[#090708] pt-12 pb-7.5">
					<div className="mx-auto max-w-295 px-7 max-phone:px-5">
						<div className="flex items-start justify-between gap-5.5 max-phone:flex-col">
							<div>
								<Brand />
								<p className="my-2.5 max-w-82.5 font-serif text-[23px] leading-[normal] text-[#a99488] italic">
									Dyskrecja jest częścią naszego dziedzictwa.
								</p>
							</div>
							<nav
								aria-label="Linki w stopce"
								className="flex flex-wrap gap-5 text-[11px] text-[#b0a19b] max-phone:gap-3.5"
							>
								<ScrollButton
									to="catalogue"
									variant="link"
									className={footerLink}
								>
									Oferta
								</ScrollButton>
								{showEvents && (
									<ScrollButton
										to="events"
										variant="link"
										className={footerLink}
									>
										Wydarzenia
									</ScrollButton>
								)}
								<ScrollButton
									to="how-it-works"
									variant="link"
									className={footerLink}
								>
									Jak działamy
								</ScrollButton>
								<ScrollButton
									to="contact"
									variant="link"
									className={footerLink}
								>
									Kontakt
								</ScrollButton>
								<ScrollButton
									to="team"
									variant="link"
									className={footerLink}
								>
									Nasz zespół
								</ScrollButton>
							</nav>
						</div>
						<div className="mt-9.25 flex justify-between gap-3 border-t border-border pt-5.5 text-[10px] tracking-[.03em] text-[#847778] max-phone:flex-col">
							<span>© 2026 SINCLAIR &amp; CO. · LOS SANTOS</span>
							<span className="text-[#c9ac81]">
								HAWICK AVENUE · LOS SANTOS
							</span>
						</div>
					</div>
				</footer>
			</div>
		</SiteProvider>
	);
}
