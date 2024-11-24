async function saveStream(streamReference, fileName) {
    try 
    {

        const response = await streamReference.stream();
        const blob = await new Response(response).blob();
        const link = document.createElement("a");
        
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
    } catch (error) {
        console.error("Error in saveStream:", error);
    }    
}