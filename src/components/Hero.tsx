const Hero = () => {
  return (
    <section className="relative overflow-hidden py-10 md:py-16">
      <div className="container">
        <div className="mx-auto max-w-5xl animate-fade-in">
          <img
            src="/flyer.jpg"
            alt="Congratulations Jams event flyer"
            className="w-full max-h-[520px] md:max-h-[680px] rounded-xl border border-border shadow-card object-contain bg-background"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
