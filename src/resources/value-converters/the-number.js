export class TheNumberValueConverter {
    toView(number) {
        return number >= 0 ? number + 1 : '';
    }
}