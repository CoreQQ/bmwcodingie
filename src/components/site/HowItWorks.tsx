import { Reveal } from './Reveal';

const STEPS = [
  {
    n: '01',
    title: 'Send the details',
    body: 'Message the model, year and what you want — CarPlay, ambient light, a fault to chase. We confirm if it’s codable.',
  },
  {
    n: '02',
    title: 'In person or remote',
    body: 'Choose what suits you: we come to the car around Dublin, or you connect remotely — for that you need a laptop and an ENET cable.',
  },
  {
    n: '03',
    title: 'We get you coded',
    body: 'In person we arrive with the tooling and plug in; remotely we connect over ENET. Either way we code or diagnose and show it working.',
  },
  {
    n: '04',
    title: 'Done — pay on completion',
    body: 'You see the result before you pay. Card or cash on completion. No dealer trip, no waiting room.',
  },
];

export function HowItWorks() {
  return (
    <section id="process" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-14 flex items-center gap-3">
          <span className="label">02 / Process</span>
          <span className="m-stripe h-[2px] w-10" />
        </div>
        <h2 className="mb-16 max-w-3xl font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
          FOUR STEPS, NO DEALER QUEUE
        </h2>

        <div className="grid grid-cols-1 gap-px bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="relative h-full bg-graphite-900 p-7">
                <span className="font-display text-5xl text-graphite-500">{s.n}</span>
                <div className="m-stripe my-4 h-[2px] w-10" />
                <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
