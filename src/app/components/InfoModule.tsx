type InfoModuleProps = {
  closeModule: () => void;
};
export default function InfoModule({ closeModule }: InfoModuleProps) {
    return (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-lg h-3/4 overflow-y-scroll bg-black/30 backdrop-blur-lg border border-[0.5px] border-[#adff2f] p-6 flex flex-col z-[20]">
            <button className="self-end mb-6 px-4 bg-black/50 border border-[0.5px] border-[#adff2f] font-semibold rounded hover:bg-[#9ae52f]" 
            onClick={closeModule}>
                Close
            </button>
            <p>this is an interactive webgl experiment. let&apos;s play!</p>
            <p className="mb-2">made with &#x2764; by <span><a href="https://www.estellekimdev.com/" target="_blank">estelle kim</a></span></p>
            <p className="font-semibold mt-4 mb-2">* how to play *</p>
            <ul className="list-disc list-inside mb-4">
                <li><span className='underline'>click the boxes</span> above to select emojis</li>
                <li><span className='underline'>hover on cloud cells</span> to drop emojis</li>
                <li>& <span className='underline'>click the cloud</span> to make it pour</li>
                <li><span className='underline'>click the canvas</span> to reset it</li>
                <li><span className='underline'>click the sky</span> to toggle paint mode</li>
            </ul>
            <p className="font-semibold mt-4 mb-2">* how the cloud works *</p>
            <ol className="list-disc list-inside mb-4">
                <li>I &apos;drew&apos; a pixel cloud using a grid of 0s & 1s.</li>
                <li>Using emojis randomly pulled from a txt file, I filled the cloud grid and rendered it on an html canvas.</li>
                <li>By random chance, or when the mouse is inside a cloud cell, I pushed the emoji into a separate list to drop and replaced the emoji at that cell.</li>
                <li>Emojis on the list to drop are repositioned in every frame with gravitational force, random horizontal movement, and repelling force near the mouse, and are deleted when they reach the bottom of the canvas.</li>
            </ol>      
            <p className="font-semibold mt-4 mb-2">* how the drip canvas works *</p>
            <ol className="list-disc list-inside mb-4">
                <li>With every frame drawn on the emoji cloud canvas, the bottommost row of pixels is copied onto the topmost row of the drip canvas.</li>
                <li>The drip canvas copies each pixel row downward using two alternating buffers, creating a downward &apos;drip&apos; effect.</li>
                <li>In the process of copying, each pixel is blurred with its neighboring pixels, diffused with the pixel above it, and decayed slightly to simulate the spreading and drying of ink on paper.</li>
                <li>The canvas is then blended with a paper texture and adjusted with transparency in wet areas to generate the final visual output.</li>
            </ol>       
        </div>
    );
};