document.querySelector('form').addEventListener('submit', (e) => {
	e.preventDefault();
	const formData = new FormData(e.target);
	const data = Object.fromEntries(formData.entries());
	console.log(data);
})