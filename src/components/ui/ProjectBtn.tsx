import Link from "next/link";

const ProjectBtn = () => {
    return (
        <Link
            href="/projects"
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-500 to-purple-600 text-white hover:from-red-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
            View My Work
        </Link>
    );
};

export default ProjectBtn;

