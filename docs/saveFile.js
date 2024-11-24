function saveFile(file, Content) {
    try 
    {
        var link = document.createElement('a');
        link.download = file;
        link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(Content)
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error("Error in saveBinary:", error);
    }    
}