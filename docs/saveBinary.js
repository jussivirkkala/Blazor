function saveBinary(fileName, base64Binary) {
    try {
        // Decode the Base64 string into binary data
        const binaryData = Uint8Array.from(atob(base64Binary), char => char.charCodeAt(0));

        // Create a Blob from the binary data
        const blob = new Blob([binaryData], { type: "application/octet-stream" });

        // Create a link element
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;

        // Append the link to the document and trigger the download
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error("Error in saveBinary:", error);
    }
}
