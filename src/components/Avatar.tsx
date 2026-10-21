import Image from "next/image";

const Avatar = () => (
    <div className="relative size-full bg-paper">
        <Image
            src="/images/avater/avater.png"
            alt="Ahmed Hamdy"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover object-top"
        />
    </div>
);

export default Avatar;
