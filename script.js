document.addEventListener('DOMContentLoaded', function() {
    const apiUrl = 'http://localhost:3001';

    async function fetchStudents() {
        const response = await fetch(`${apiUrl}/students`);
        return response.json();
    }

    function loadStudents() {
        fetchStudents().then(students => {
            const studentList = document.getElementById('studentList');
            studentList.innerHTML = students.map(student => `
                <div class="student">
                    <img src="${student.img}" alt="${student.name}" class="student-img">
                    <h2>${student.name}</h2>
                    <p>Roll No: ${student.rollno}</p>
                    <p>Phone: ${student.phone}</p>
                    <p>Address: ${student.address}</p>
                    <button onclick="showEditForm('${student._id}')">Edit</button>
                </div>
            `).join('');
        }).catch(error => {
            console.error(error);
            document.getElementById('studentList').innerHTML = '<p>Failed to load student list.</p>';
        });
    }

    document.getElementById('addStudentForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        fetch(`${apiUrl}/students`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(newStudent => {
            closeAddStudentForm();
            loadStudents();  // Reload the student list
        })
        .catch(error => console.error('Error:', error));
    });

    document.getElementById('editStudentForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const studentId = document.getElementById('editStudentId').value;

        fetch(`${apiUrl}/students/${studentId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => response.json())
        .then(updatedStudent => {
            hideEditForm();
            loadStudents();  // Reload the student list
        })
        .catch(error => console.error('Error:', error));
    });

    window.showEditForm = async function(studentId) {
        const student = await fetchStudentDetails(studentId);
        document.getElementById('editStudentId').value = student._id;
        document.getElementById('editName').value = student.name;
        document.getElementById('editRollNo').value = student.rollno;
        document.getElementById('editPhone').value = student.phone;
        document.getElementById('editAddress').value = student.address;

        document.getElementById('editStudentPopup').style.display = 'flex';
    };

    window.hideEditForm = function() {
        document.getElementById('editStudentPopup').style.display = 'none';
    };

    window.openAddStudentForm = function() {
        document.getElementById('addStudentPopup').style.display = 'flex';
    };

    window.closeAddStudentForm = function() {
        document.getElementById('addStudentPopup').style.display = 'none';
    };

    async function fetchStudentDetails(studentId) {
        const response = await fetch(`${apiUrl}/students/${studentId}`);
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Student not found');
        }
    }

    // Initial load
    loadStudents();
});
