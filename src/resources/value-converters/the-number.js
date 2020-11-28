export class TheNumberValueConverter {
	// The model is working with 0..8
	// The view needs 1..9
	toView(number) {
		return number >= 0 ? number + 1 : '';
	}
}
