function handleFileInputClick(inputId) {
    document.getElementById(inputId).click();
}

// prompts the user for a file
function fileSelected() {
    const input = document.getElementById('id_project_file_input');
    const file = input.files[0];
    if (file) {
        console.log(`File selected: ${file.name}`);

        // create formData object to hold file data
        const formData = new FormData();
        formData.append('project_file', file);

        // create XMLHttpRequest to send the file
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);

        xhr.onload = function () {
            if (xhr.status === 200) {
                console.log('File uploaded successfully');
            }
            else {
                console.error('File upload failed');
            }
        };

        xhr.send(formData);
    }
    else {
        console.log("No file selected");
    }
}