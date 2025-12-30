import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Error en sección ${this.props.sectionName}:`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error en {this.props.sectionName || 'esta sección'}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>No se pudo cargar este contenido.</span>
            <Button size="sm" variant="outline" onClick={this.handleRetry}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
